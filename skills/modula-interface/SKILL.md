---
name: "modula-interface"
description: "Provide HTTP REST APIs and Simulator for Modula warehouse TCP integration. Invoke when user wants to interact with Modula bays, inbound/outbound jobs, or switch live/sim modes."
---

# Modula REST Gateway Interface

## Scope

Use this skill when developing, configuring, or debugging the Modula REST Gateway (`ModulaInterface` project).

## Project Overview

- **Location**: `C:\Steven\Orbis\KSB 临港项目\Trae\KSB\ModulaInterface\ModulaInterface-main`
- **Tech Stack**: Java 21, Spring Boot 3.3.3, SQLite.
- **Core Function**: Translates Modula Link TCP protocol (`CALL`, `EXTRACT`, `INSERTION`, `RETURN`) into modern HTTP REST APIs.
- **Layers**: Strictly separated into Domain, Application, Infrastructure, and Web layers.

## Key Rules Followed in Codebase

- Keep files small and cohesive.
- Keep domain interfaces independent of transport or persistence.
- Hide Modula protocol details behind the `ModulaDriver` abstraction.
- Make simulator (`SIM`) and live (`LIVE`) implementations swappable through configuration.
- Bay operations must use `BayLockManager` to avoid concurrent Modula commands on the same Bay.

## Hardware & Workflow Specifications

When orchestrating Modula operations, the following business and hardware constraints MUST be enforced:

1. **Machine-Level Mutual Exclusion (High/Low Bays)**:
   - A single Modula machine often has two bays (one high, one low).
   - **Constraint**: Only ONE tray can be extracted at any given time across the entire machine.
   - **Action**: If a tray is already out at one bay, requests for the other bay MUST enter a waiting/queued state until the first tray is returned. You cannot issue concurrent extraction/insertion commands to both bays of the same machine.
2. **Mandatory Status Checks**:
   - **Constraint**: Never blindly send commands.
   - **Action**: Every Modula operation sequence MUST begin by fetching the current `status` (via `GET /api/v1/bays/{bayId}/status` or `ModulaDriver.getStatus()`). Use this status as the baseline to determine if the machine is ready (e.g., `IDLE`) before issuing any command like `CALL` or `INSERTION`.
3. **Light Management Lifecycle**:
   - **Constraint**: Lights must not be left on indefinitely.
   - **Action**: Every time a tray is returned to the machine (via the `RETURN` command), you MUST explicitly ensure the lights are turned off if they were turned on during the tray's operation phase.

## Common REST API Endpoints

- `GET /api/v1/bays/{bayId}/status` - Get Bay status.
- `POST /api/v1/outbound-jobs` - Create outbound job (Trigger CALL/EXTRACT).
- `POST /api/v1/inbound-jobs` - Create inbound job (Trigger INSERTION).
- `POST /api/v1/jobs/{jobId}/confirm-extracted` - Confirm tray extraction.
- `POST /api/v1/jobs/{jobId}/confirm-inserted` - Confirm tray insertion.
- `POST /api/v1/jobs/{jobId}/return` - Return an outbound tray to the machine.
- `GET /api/v1/sim/state` - Get Simulator state.

## Configuration & Live Mode (`LIVE`)

- Configuration files: `application.yml` and `application-live.yml`.
- **Bay Mappings**: Business `bayId` must map to Modula `prefix` (e.g. `B1` -> `11`).
- When testing on live machines, provide:
  - Modula Link IP (`host`) & Port (typically `11000`).
  - Correct Protocol Version (e.g. `"2.0"`).

## Run Prerequisites

- Java 21
- Maven 3.9+
- Start locally using: `mvn spring-boot:run`
- To run with live config: `mvn spring-boot:run -Dspring-boot.run.profiles=live`
