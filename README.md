# 👾 Parallel

**Live at:** [MyParallel](https://myparallel.com.au)

**A gamified, autonomous 8-bit virtual workspace designed to combat isolation and boost focus.**

## 💡 The Vision: Virtual Body Doubling

Many of us struggle to stay productive when working completely alone, often relying on the ambient energy of a bustling cafe or the quiet focus of a library to stay on task—a psychological concept known as "body doubling." 

Parallel was engineered to recreate that presence digitally. It is a real-time, 2.5D isometric room simulation running in the browser that serves as a virtual companion. Instead of staring at a static Pomodoro timer, users work alongside an autonomous digital roommate who lives out a schedule synchronized to the real world. When you sit down to grind out work, they are at their desk. When it's late at night, the room goes dark and they go to sleep. It brings the productivity-boosting presence of another person into your workspace, wrapped in a classic 8-bit pixel art aesthetic.

## ⚙️ Technical Architecture & Highlights

This project was built from the ground up without relying on heavy game engines like Unity or Godot. It is a showcase of custom rendering mathematics, browser optimization, and vanilla JavaScript state management.

### 1. Custom 2D Isometric Pathfinding Engine and UI
Navigating an isometric grid requires strict mathematical translations between screen space and world space. 
* **Custom UI and Animations:** Most of the drawings and pixel art that you see is hand drawn! The addition of custom art and animations gives the feeling of 
* **Waypoint Routing:** Rather than snapping from point A to point B, the engine calculates exact intersection coordinates (e.g., navigating around the edge of the couch) to dynamically stitch coordinate arrays together for seamless, multi-directional sprite animations.

### 2. Autonomous State Machine & Real-Time Sync
The character operates on a decoupled Master Schedule loop that listens to the user's local system clock.
* **State Management:** The engine dynamically transitions the character between physical states (`IDLE`, `WORKING`, `SLEEPING`, `SIPPING_COFFEE`).
* **Teleportation vs. Pathing:** If a user loads the site mid-task (e.g., at 2:00 PM), the system calculates the required state, bypasses the walking animation, and instantly resolves the character's physical `x, y` coordinates to the desk to maintain the illusion of continuous existence.

### 3. Asynchronous Loading & Lifecycle Management
To ensure a flawless first render, the application utilizes a strict lifecycle sequence.
* **Asset Parsing:** A dynamic loading screen masks the WebGL rendering process while PixiJS asynchronously fetches and parses the spritesheets and textures.
* **Race Condition Mitigation:** To prevent the production bundler (Vite) from executing canvas dimension calculations before the CSS DOM has fully painted, the engine dispatches a synthetic `window.resize` event immediately upon the resolution of the loading Promise.

### 4. Advanced CSS Geometry & Viewport Handling
The UI is built completely without images or SVG backgrounds, relying entirely on CSS mathematics to remain infinitely scalable and lightweight.
* **8-Bit Staggered Polygons:** The retro chat bubbles and UI elements are carved out of raw DOM elements using complex `clip-path: polygon()` coordinates to create mathematically perfect, pixelated 8-bit corners.
* **Dynamic Viewport Trapping:** Uses the modern `100dvh` (Dynamic Viewport Height) unit and strict overflow management to prevent mobile browser navigation bars (like iOS Safari) from breaking the canvas dimensions or exposing the background DOM.

## 🔮 Future Roadmap

* **AI Integration:** Upgrading the character from a static schedule-follower into an intelligent, interactive companion using LLM APIs. This will allow dynamic conversations and personalized productivity coaching via the custom 8-bit chat interface.
* **Guest Characters & Co-op Mode:** Implementing dynamic sprite rendering and advanced state management to support multiple characters in the room. As of now you are just a viewer of "Angad's room", but soon you will appear along side Angad inside his room! This will further enforce the idea of 'body doubling' and give a sense companionship!
* **More Rooms:** Right now users can only opt in to be apart of Angad's room but eventually users will have the choice between a cafe, libray and Angad's room. The cafe will be a lively environment where users will be able to see other live users to really mimic the Cafe vibes.
* **Brain Music Implementation:** Research shows that certain people study/focus better with certain types of music! An addition to passive background music which varies according to the room that you are in will guide you to focus on your task!
  
## 🛠️ Tech Stack

* **PixiJS:** Handles the WebGL 2D rendering pipeline and animated spritesheets.
* **Vanilla JavaScript:** Powers the state machine, asynchronous data handling, API integrations, and pathfinding math.
* **HTML5 / CSS3:** Responsive UI overlays, media queries for cross-device scaling, and pure-CSS dynamic weather animations (parallax clouds, rain, stars).
* **Vite:** Next-generation frontend tooling for optimized, minified production bundling and Hot Module Replacement (HMR).

## Comments 
Let me know if there are any bugs that you find or any changes that you think I should make! Thank you for reading through this and visiting MyParallel! 
