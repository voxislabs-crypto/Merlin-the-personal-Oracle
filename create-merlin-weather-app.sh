#!/bin/bash

###############################################################################
# Merlin 2.0 - Life Weather Intelligence App Generator
# Creates a clean, modern project focused on Cafe forecast, pressure radar,
# daily moves, and weather metaphors.
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="${1:-merlin-weather-app}"
TARGET_DIR="${2:-.}"
PROJECT_PATH="$TARGET_DIR/$PROJECT_NAME"

print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ Merlin 2.0 - Life Weather App Generator${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

create_directory() {
  mkdir -p "$1"
  print_success "Created: $1"
}

create_file() {
  mkdir -p "$(dirname "$1")"
  echo "$2" > "$1"
  print_success "Created: $1"
}

print_header
print_info "Creating project: $PROJECT_NAME"

# Create structure
create_directory "$PROJECT_PATH"
create_directory "$PROJECT_PATH/src/components"
create_directory "$PROJECT_PATH/src/hooks"
create_directory "$PROJECT_PATH/src/lib"
create_directory "$PROJECT_PATH/public"

# package.json (Vite + React + Tailwind + Framer Motion)
create_file "$PROJECT_PATH/package.json" '{
  "name": "'$PROJECT_NAME'",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47"
  }
}'

# Basic Vite + Tailwind setup (you can expand later)
create_file "$PROJECT_PATH/vite.config.ts" 'import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true }
});'

# Tailwind config
create_file "$PROJECT_PATH/tailwind.config.js" 'module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}'

# Main App with Life Weather focus
create_file "$PROJECT_PATH/src/App.tsx" 'import React from "react";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    
      
    

  );
}

export default App;'

# Dashboard component (clean Life Weather shell)
create_file "$PROJECT_PATH/src/components/Dashboard.tsx" 'import React from "react";
import { CloudRain, Sun, CloudLightning, MessageCircle } from "lucide-react";

export default function Dashboard() {
  return (
    
      
        
          
            Merlin
          
          Life Weather Intelligence

        

        Good to see you

      

      {/* Hero - Current Weather */}
      
        
          ⛈️

          
            Building Pressure
            Moderate mental load today. Protect your focus and move with intention.

          

          
            67

            CAFE INDEX

          

        

      

      {/* Pressure Windows */}
      
        {[
          { time: "Morning", icon: "🌧️", label: "Light Rain", desc: "Protect focus" },
          { time: "Midday", icon: "☀️", label: "Clearing", desc: "Best for decisions" },
          { time: "Evening", icon: "⚡", label: "Storm Risk", desc: "Low energy recovery" }
        ].map((item, i) => (
          
            {item.icon}

            {item.label}
            {item.desc}

          

        ))}
      

      {/* Ask Merlin */}
      
        
        Talk to Merlin
        What should you focus on today? Where is pressure building?

        
          Ask Merlin Now
        

      

    

  );
}
'

print_success "Merlin 2.0 Life Weather project created successfully!"
print_info "Next steps:"
print_info "   cd $PROJECT_NAME"
print_info "   npm install"
print_info "   npm run dev"
