#!/bin/bash

# Real-Time Salon Management System Startup Script
# This script starts all components needed for the real-time system

echo "🚀 Starting Real-Time Salon Management System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start WebSocket server
start_websocket_server() {
    echo -e "${BLUE}📡 Starting WebSocket Server...${NC}"
    
    if check_port 3001; then
        echo -e "${YELLOW}⚠️  Port 3001 is already in use. WebSocket server might already be running.${NC}"
        return
    fi
    
    cd websocket-server
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing WebSocket server dependencies...${NC}"
        npm install
    fi
    
    # Start server in background
    echo -e "${GREEN}✅ Starting WebSocket server on port 3001...${NC}"
    npm start &
    WEBSOCKET_PID=$!
    
    cd ..
    
    # Wait for server to start
    sleep 3
    
    if check_port 3001; then
        echo -e "${GREEN}✅ WebSocket server started successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to start WebSocket server${NC}"
        exit 1
    fi
}

# Function to start React app
start_react_app() {
    echo -e "${BLUE}⚛️  Starting React App...${NC}"
    
    if check_port 3000; then
        echo -e "${YELLOW}⚠️  Port 3000 is already in use. React app might already be running.${NC}"
        return
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing React app dependencies...${NC}"
        npm install
    fi
    
    # Start React app in background
    echo -e "${GREEN}✅ Starting React app on port 3000...${NC}"
    npm start &
    REACT_PID=$!
    
    # Wait for app to start
    sleep 5
    
    if check_port 3000; then
        echo -e "${GREEN}✅ React app started successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to start React app${NC}"
        exit 1
    fi
}

# Function to show system status
show_status() {
    echo ""
    echo "🔍 System Status:"
    echo "=================="
    
    if check_port 3001; then
        echo -e "WebSocket Server: ${GREEN}🟢 Running${NC} (http://localhost:3001)"
    else
        echo -e "WebSocket Server: ${RED}🔴 Not Running${NC}"
    fi
    
    if check_port 3000; then
        echo -e "React App:        ${GREEN}🟢 Running${NC} (http://localhost:3000)"
    else
        echo -e "React App:        ${RED}🔴 Not Running${NC}"
    fi
    
    echo ""
    echo "📊 API Endpoints:"
    echo "=================="
    echo "• Server Status:    http://localhost:3001/api/status"
    echo "• Salon Data:       http://localhost:3001/api/salons"
    echo "• Queue Data:       http://localhost:3001/api/salons/salon_1/queue"
    echo ""
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}🧪 Running Real-Time Integration Tests...${NC}"
    
    if [ ! -f "test-realtime.js" ]; then
        echo -e "${RED}❌ Test file not found${NC}"
        return
    fi
    
    # Check if WebSocket server is running
    if ! check_port 3001; then
        echo -e "${RED}❌ WebSocket server is not running. Please start it first.${NC}"
        return
    fi
    
    echo -e "${GREEN}✅ Starting interactive test suite...${NC}"
    node test-realtime.js
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  start     Start all services (WebSocket server + React app)"
    echo "  server    Start only WebSocket server"
    echo "  app       Start only React app"
    echo "  status    Show system status"
    echo "  test      Run real-time integration tests"
    echo "  stop      Stop all services"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start everything"
    echo "  $0 status   # Check what's running"
    echo "  $0 test     # Run tests"
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    
    # Kill processes on ports 3000 and 3001
    if check_port 3001; then
        echo -e "${YELLOW}Stopping WebSocket server...${NC}"
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port 3000; then
        echo -e "${YELLOW}Stopping React app...${NC}"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    stop_services
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main script logic
case "${1:-start}" in
    "start")
        echo -e "${GREEN}🚀 Starting all services...${NC}"
        start_websocket_server
        start_react_app
        show_status
        echo ""
        echo -e "${GREEN}🎉 System is ready!${NC}"
        echo -e "${BLUE}💡 Tip: Run './start-realtime-system.sh test' to run integration tests${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
        
        # Keep script running
        while true; do
            sleep 10
            # Check if services are still running
            if ! check_port 3001 && ! check_port 3000; then
                echo -e "${RED}❌ All services stopped${NC}"
                break
            fi
        done
        ;;
    "server")
        start_websocket_server
        show_status
        echo -e "${YELLOW}Press Ctrl+C to stop WebSocket server${NC}"
        wait
        ;;
    "app")
        start_react_app
        show_status
        echo -e "${YELLOW}Press Ctrl+C to stop React app${NC}"
        wait
        ;;
    "status")
        show_status
        ;;
    "test")
        run_tests
        ;;
    "stop")
        stop_services
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        show_usage
        exit 1
        ;;
esac