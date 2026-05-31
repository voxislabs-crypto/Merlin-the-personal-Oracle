import React from "react";
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

