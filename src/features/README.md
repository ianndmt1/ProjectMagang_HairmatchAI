# Feature-Based Clean Architecture

This directory contains the feature modules of HairMatch AI. Each feature contains clean architecture layers to ensure high maintainability, strict mode TypeScript compilation, and ease of testing.

## Folder Structure per Feature

Inside each feature (e.g., `auth`, `face-analysis`):
- `domain/`: Contains validation schemas, types, entities, and enterprise logic.
- `application/`: Contains React hooks, context, state management, and business logic.
- `infrastructure/`: Contains direct API / database calls, Supabase endpoints, and external SDK configurations.
- `presentation/`: Contains page files, layout containers, forms, and pure UI components.
