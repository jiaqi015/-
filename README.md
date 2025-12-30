
# Leifi Lab (徕滤相机) v3.0

A high-end, minimalist camera filter workshop with a Leica-inspired aesthetic. **Now powered by Gemini 3 Pro.**

## Architecture (DDD)

- **Domain**: Core entities (`DevelopSession`) and types (`CameraProfile`).
- **Application**: Orchestration layer (`DevelopPhotoUseCase`).
- **Infrastructure**: Now features `GeminiImageProcessor` which leverages `gemini-3-pro-image-preview` for sophisticated neural rendering.
- **Presentation**: UI layer with mandatory API Key selection flow for high-quality compute.

## Evolution to AI
The v3.0 update replaces standard Canvas filters with a Neural Synthesis engine. Instead of pixel-level mathematical operations, the app now performs "optical reconstruction" based on rich descriptive templates.

## Key Selection (Mandatory)
Because this app uses the high-performance `gemini-3-pro-image-preview` model, users must select a paid API key from their own GCP project. 
Visit [ai.google.dev/gemini-api/docs/billing](https://ai.google.dev/gemini-api/docs/billing) for setup.

## Features
- **Neural Synthesis**: True optical simulation using LLM-vision integration.
- **Artist-Grade Prompts**: Each camera profile contains a high-density directive for texture, light, and atmosphere.
- **Minimalist Aesthetic**: Pure Leica-inspired UX.
- **Data-Driven**: Easily extendable camera catalog.

## How to Start
1. Ensure you have Node.js installed.
2. Run `npm start`.
3. When prompted, select your API Key to enable the AI engine.

## How to Add a New Camera
Modify `infrastructure/resources/cameras.ts`. Ensure your `promptTemplate` is rich with technical photography terms to guide the Gemini engine effectively.
