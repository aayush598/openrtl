// OpenRTL task bank
// 36-phase FPGA / IC product development lifecycle.
// Tier 1 = phase -> Tier 2 = task -> Tier 3 = subtask with concrete steps.
// Each phase also declares its quality-gate exit criteria, decision-log items,
// and mandatory engineering reviews. The scaffold tool renders these into
// per-phase task files, gates, decisions, and review tickets.

export type Step = string
export type Subtask = { title: string; steps: Step[] }
export type Task = { id: string; title: string; objective: string; subtasks: Subtask[] }
export type ReviewType =
  | "requirements"
  | "architecture"
  | "hardware"
  | "rtl"
  | "verification"
  | "timing"
  | "power"
  | "security"
  | "manufacturing"
  | "release"

export type Phase = {
  id: string
  num: number
  name: string
  /** Lifecycle group used for presets: "full" runs everything, "fast-proto" skips market/formal/manufacturing-heavy work. */
  group: "define" | "design" | "implement" | "verify" | "produce" | "sustain"
  description: string
  contextFiles: string[]
  tasks: Task[]
  /** Quality-gate exit criteria; progression is blocked until all pass or are explicitly waived. */
  gates: string[]
  /** Decision-log entries that must exist for this phase. */
  decisions: string[]
  /** Mandatory engineering reviews for this phase. */
  reviews: ReviewType[]
  /** Phases whose completion this phase depends on. */
  dependsOn: string[]
}

export const PHASES: Phase[] = [
  // ---------------------------------------------------------------------------
  // 00 — Project
  // ---------------------------------------------------------------------------
  {
    id: "00-project",
    num: 0,
    name: "Project",
    group: "define",
    description:
      "Initialize the OpenRTL workspace, project metadata, decision log, toolchain, and directory structure. Every subsequent phase reads and updates the context files created here.",
    contextFiles: [
      "00-project/README.md",
      "00-project/project-description.md",
      "00-project/glossary.md",
      "00-project/project-schema.json",
      "00-project/decisions/DECISION-000-template.md",
      "00-project/decisions/INDEX.md",
      "00-project/risk-register.md",
    ],
    gates: [
      "Workspace initialized with all 36 phase folders",
      "Project metadata (openrtl-project.json / project-schema.json) created and versioned",
      "Toolchain verified and versions recorded",
      "Decision log initialized with template and index",
    ],
    decisions: [
      "DECISION-000 — Decision log format and workflow",
      "DECISION-001 — Toolchain and vendor-tool adapter policy",
    ],
    reviews: ["architecture"],
    dependsOn: [],
    tasks: [
      {
        id: "T00.1",
        title: "Project scaffold",
        objective: "Create the OpenRTL project directory tree and configuration.",
        subtasks: [
          {
            title: "Directory tree",
            steps: [
              "Run the OpenRTL scaffold tool to generate all 36 phase folders under docs/.",
              "Verify every phase folder (00..35) exists with a README, tasks/, gates.md and status.md.",
              "Confirm docs/tasks/index.md task index was generated and is readable.",
            ],
          },
          {
            title: "Project metadata",
            steps: [
              "Create project-schema.json with name, description, owner, organization, team roles, and permission model.",
              "Record tags, custom properties, and dependency graph of shared libraries/components.",
              "Initialize the audit log (append-only) for project activity.",
            ],
          },
          {
            title: "OpenRTL config",
            steps: [
              "Ensure opencode.jsonc at project root enables the OpenRTL bundle (skills, agents, commands).",
              "Set default_agent to openrtl and default model to the configured provider model.",
              "Verify the OpenRTL skills appear in the skills list (openrtl-*).",
            ],
          },
          {
            title: "Toolchain verification",
            steps: [
              "Verify open-source toolchain availability: yosys, nextpnr, verilator, iverilog, cocotb, symbiyosys, opensta, riscv-gcc, pyserial.",
              "Record toolchain versions and optional commercial-tool adapters (vivado/quartus/libero) in 00-project/README.md.",
              "Add a smoke-test script that runs a trivial synthesis + simulation to confirm the toolchain works.",
            ],
          },
        ],
      },
      {
        id: "T00.2",
        title: "Project description intake",
        objective: "Capture the user's full product description as the authoritative input.",
        subtasks: [
          {
            title: "Capture",
            steps: [
              "Ask the user for a complete description of the FPGA/IC product to develop.",
              "Record the raw description verbatim in 00-project/project-description.md.",
              "Ask targeted clarifying questions: target market, interfaces, performance needs, budget, timeline.",
            ],
          },
          {
            title: "Normalize",
            steps: [
              "Extract explicit and implicit requirements from the description.",
              "Define a first-cut glossary of domain terms in 00-project/glossary.md.",
              "Identify constraints (cost, power, size, environment, compliance) that must drive later phases.",
            ],
          },
          {
            title: "Epic breakdown",
            steps: [
              "Create the Epic map: Epic -> Task -> Subtask -> Microtask -> checklist -> completion criteria -> verification -> review -> approval.",
              "Assign each Epic an owner from the project roles.",
              "Link Epics to the phases that deliver them in the task index.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 01 — Ideation
  // ---------------------------------------------------------------------------
  {
    id: "01-ideation",
    num: 1,
    name: "Ideation",
    group: "define",
    description:
      "Translate the project description into a detailed ideation document. User confirmation gate before requirements.",
    contextFiles: ["01-ideation/ideation.md"],
    gates: [
      "Ideation document produced covering vision, scope, value, and feasibility",
      "Explicit user approval recorded",
      "Concept alternatives compared with recommendation",
    ],
    decisions: ["DECISION-010 — Chosen concept direction and rationale"],
    reviews: ["requirements"],
    dependsOn: ["00-project"],
    tasks: [
      {
        id: "T01.1",
        title: "Ideation document",
        objective: "Produce a complete ideation document covering vision, scope, value, and feasibility.",
        subtasks: [
          {
            title: "Vision and scope",
            steps: [
              "Write the product vision and value proposition in one paragraph.",
              "Define in-scope and out-of-scope items explicitly.",
              "List target users, use cases, and key success metrics.",
            ],
          },
          {
            title: "Concept alternatives",
            steps: [
              "Propose 2-3 high-level solution concepts (e.g., pure FPGA, SoC FPGA, FPGA+MCU).",
              "Compare concepts across cost, power, performance, and time-to-market.",
              "Recommend a preferred concept with rationale.",
            ],
          },
        ],
      },
      {
        id: "T01.2",
        title: "User confirmation gate",
        objective: "Get explicit user approval of the ideation document before proceeding.",
        subtasks: [
          {
            title: "Review",
            steps: [
              "Present the ideation document summary to the user.",
              "Ask whether the ideation is acceptable or needs changes.",
              "If changes requested, update 01-ideation/ideation.md and re-present.",
            ],
          },
          {
            title: "Approve",
            steps: [
              "Record explicit user confirmation in 01-ideation/ideation.md (approval section).",
              "Record the concept decision in the decision log.",
              "Mark phase complete in status.md and close the phase gate.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 02 — Market
  // ---------------------------------------------------------------------------
  {
    id: "02-market",
    num: 2,
    name: "Market",
    group: "define",
    description:
      "Market analysis: personas, TAM/SAM/SOM, competitive landscape, pricing, and voice-of-customer. Feeds requirements and the business case.",
    contextFiles: [
      "02-market/market-analysis.md",
      "02-market/personas.md",
      "02-market/competition.md",
      "02-market/pricing.md",
    ],
    gates: [
      "Market analysis with TAM/SAM/SOM completed",
      "Personas and key use cases defined",
      "Competitive landscape with differentiation strategy documented",
      "Pricing model proposed",
    ],
    decisions: ["DECISION-020 — Target market segment and pricing model"],
    reviews: ["requirements"],
    dependsOn: ["01-ideation"],
    tasks: [
      {
        id: "T02.1",
        title: "Market sizing",
        objective: "Quantify the addressable market and segment.",
        subtasks: [
          {
            title: "Segments",
            steps: [
              "Define the target segments and buyer personas in personas.md.",
              "Estimate TAM, SAM, and SOM with clear assumptions.",
              "Identify adjacent segments for future expansion.",
            ],
          },
        ],
      },
      {
        id: "T02.2",
        title: "Competition and pricing",
        objective: "Position the product against competition.",
        subtasks: [
          {
            title: "Competitive landscape",
            steps: [
              "Map competitors, their offerings, strengths, and weaknesses in competition.md.",
              "Define the differentiation strategy and win themes.",
              "Identify the voice-of-customer requirements that matter most to buyers.",
            ],
          },
          {
            title: "Pricing",
            steps: [
              "Propose pricing (cost-plus, value-based, competitive) with rationale in pricing.md.",
              "Estimate unit volume over 3-5 years to feed the business case.",
              "Link top market requirements to the requirements phase.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 03 — Requirements
  // ---------------------------------------------------------------------------
  {
    id: "03-requirements",
    num: 3,
    name: "Requirements",
    group: "define",
    description:
      "Extremely detailed requirements file covering all non-functional and functional domains, plus PRD, SRS, FRS, risk register, and traceability.",
    contextFiles: [
      "03-requirements/requirements.md",
      "03-requirements/PRD.md",
      "03-requirements/SRS.md",
      "03-requirements/FRS.md",
      "03-requirements/cost-target.md",
      "03-requirements/performance-target.md",
      "03-requirements/power-target.md",
      "03-requirements/environmental.md",
      "03-requirements/lifetime.md",
      "03-requirements/reliability-goals.md",
      "03-requirements/supply-chain.md",
      "03-requirements/obsolescence.md",
      "03-requirements/security.md",
      "03-requirements/safety.md",
      "03-requirements/emi.md",
      "03-requirements/certifications.md",
      "03-requirements/manufacturing.md",
      "03-requirements/serviceability.md",
      "03-requirements/maintainability.md",
      "03-requirements/repairability.md",
      "03-requirements/documentation.md",
      "03-requirements/deliverables.md",
      "03-requirements/risk-register.md",
      "03-requirements/traceability-matrix.md",
    ],
    gates: [
      "Requirements Complete: every requirement categorized and approved",
      "Requirements Reviewed by the requirements review",
      "Requirements Approved with explicit user sign-off",
      "Traceable: PRD -> SRS -> FRS -> test cases",
      "Risk register initialized and reviewed",
    ],
    decisions: ["DECISION-030 — Requirements baseline approval"],
    reviews: ["requirements"],
    dependsOn: ["01-ideation", "02-market"],
    tasks: [
      {
        id: "T03.1",
        title: "Non-functional requirements",
        objective: "Capture every non-functional requirement category.",
        subtasks: [
          {
            title: "Commercial and physical targets",
            steps: [
              "Define Cost target (BOM cost, NRE, target unit price).",
              "Define Performance target (throughput, latency, resolution, accuracy).",
              "Define Power target (total, per rail, thermal budget).",
            ],
          },
          {
            title: "Environmental and reliability",
            steps: [
              "Define Environmental requirements (temperature, humidity, shock, vibration, altitude).",
              "Define Lifetime (years, hours, endurance).",
              "Define Reliability goals (MTBF, FIT, availability).",
            ],
          },
          {
            title: "Supply chain and obsolescence",
            steps: [
              "Define Supply chain availability (lead times, dual sourcing).",
              "Perform Obsolescence analysis (component lifecycle, LTB notices, mitigation).",
            ],
          },
          {
            title: "Security, safety, EMI, compliance",
            steps: [
              "Define Security requirements (secure boot, crypto, anti-tamper, debug lock).",
              "Define Safety requirements (hazards, FMEA, safe states).",
              "Define EMI requirements (conducted/radiated limits).",
              "Define Certifications required (CE, FCC, UL, RoHS, etc.).",
            ],
          },
          {
            title: "Manufacturing and serviceability",
            steps: [
              "Define Manufacturing target (volume, yield, DFM).",
              "Define Serviceability, Maintainability, Repairability requirements.",
            ],
          },
          {
            title: "Documentation and deliverables",
            steps: [
              "Define Documentation requirements (what docs, to what standard).",
              "Define Deliverables list (RTL, testbenches, bitstreams, reports, manuals).",
            ],
          },
        ],
      },
      {
        id: "T03.2",
        title: "Requirements documents",
        objective: "Generate PRD, SRS, FRS and traceability matrix.",
        subtasks: [
          {
            title: "PRD",
            steps: [
              "Write Product Requirement Document: market need, personas, feature set, KPIs.",
              "Map every feature to a measurable success metric.",
            ],
          },
          {
            title: "SRS",
            steps: [
              "Write System Requirements Specification: system-level functional and interface requirements.",
              "Assign unique requirement IDs (REQ-XXXX).",
            ],
          },
          {
            title: "FRS",
            steps: [
              "Write Functional Requirements Specification: detailed functional behavior per module.",
              "Cover interfaces, states, error handling, and timing for each function.",
            ],
          },
          {
            title: "Traceability",
            steps: [
              "Build traceability-matrix.md mapping PRD -> SRS -> FRS -> test cases.",
              "Verify every requirement has a test and every test traces to a requirement.",
            ],
          },
        ],
      },
      {
        id: "T03.3",
        title: "Risk register",
        objective: "Create a living risk register.",
        subtasks: [
          {
            title: "Risk identification",
            steps: [
              "Identify technical, schedule, supply chain, compliance, and team risks.",
              "Assign each risk an ID, category, likelihood, and impact score.",
            ],
          },
          {
            title: "Mitigation",
            steps: [
              "Define mitigation strategies and owners for each risk.",
              "Define trigger thresholds and contingency plans.",
              "Review the risk register with the user at each phase gate.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 04 — Feasibility
  // ---------------------------------------------------------------------------
  {
    id: "04-feasibility",
    num: 4,
    name: "Feasibility",
    group: "define",
    description:
      "Technical, market, schedule, and manufacturing feasibility study with alternative trade-offs. Produces the go/no-go recommendation that gates architecture work.",
    contextFiles: [
      "04-feasibility/feasibility.md",
      "04-feasibility/alternatives.md",
      "04-feasibility/trade-study.md",
    ],
    gates: [
      "Technical feasibility assessed against every top requirement",
      "Market and schedule feasibility assessed",
      "Alternative trade study completed with weighted scoring",
      "Go/no-go recommendation documented and approved",
    ],
    decisions: ["DECISION-040 — Feasibility go/no-go recommendation"],
    reviews: ["requirements", "architecture"],
    dependsOn: ["02-market", "03-requirements"],
    tasks: [
      {
        id: "T04.1",
        title: "Technical feasibility",
        objective: "Assess technical risk against requirements.",
        subtasks: [
          {
            title: "Requirement mapping",
            steps: [
              "Map each top requirement to a technical feasibility assessment.",
              "Identify FPGA resource, interface, performance, and power feasibility.",
              "Flag requirements at risk with an owner and trigger.",
            ],
          },
        ],
      },
      {
        id: "T04.2",
        title: "Trade study and go/no-go",
        objective: "Compare alternatives and decide.",
        subtasks: [
          {
            title: "Alternatives",
            steps: [
              "Enumerate architecture/implementation alternatives with cost, schedule, performance, and risk scores.",
              "Run a weighted trade study and record it in trade-study.md.",
            ],
          },
          {
            title: "Decision",
            steps: [
              "Document the go/no-go recommendation with rationale.",
              "Record the decision in the decision log.",
              "Close the gate with the user (approve or request changes).",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 05 — System Architecture
  // ---------------------------------------------------------------------------
  {
    id: "05-system-architecture",
    num: 5,
    name: "System Architecture",
    group: "design",
    description:
      "Full system architecture: block diagram, data flow, memory, bus, partitioning, boot/update, and quantitative estimates. Feeds all subsystem architecture phases.",
    contextFiles: [
      "05-system-architecture/system-architecture.md",
      "05-system-architecture/block-diagram.md",
      "05-system-architecture/data-flow.md",
      "05-system-architecture/memory-architecture.md",
      "05-system-architecture/bus-architecture.md",
      "05-system-architecture/partitioning.md",
      "05-system-architecture/boot-architecture.md",
      "05-system-architecture/update-architecture.md",
      "05-system-architecture/calculations.md",
    ],
    gates: [
      "System architecture reviewed by the architecture review",
      "Block diagram, data flow, memory, bus, partitioning completed",
      "Boot and update architecture defined",
      "Quantitative estimates (bandwidth, latency, power, resources) completed",
      "Architecture decisions logged and approved",
    ],
    decisions: [
      "DECISION-050 — System partitioning and processing element selection",
      "DECISION-051 — Memory hierarchy and bus architecture",
    ],
    reviews: ["architecture"],
    dependsOn: ["03-requirements", "04-feasibility"],
    tasks: [
      {
        id: "T05.1",
        title: "Architecture views",
        objective: "Create all system architecture documents.",
        subtasks: [
          {
            title: "Block diagram and data flow",
            steps: [
              "Draw the system block diagram (text/ASCII or diagram) in block-diagram.md.",
              "Document data flow between all blocks in data-flow.md.",
              "Identify control vs data planes.",
            ],
          },
          {
            title: "Memory and bus",
            steps: [
              "Design the memory hierarchy (registers, BRAM, URAM, DDR, external) in memory-architecture.md.",
              "Define bus architecture (AXI, AHB, APB, Wishbone) and interconnect in bus-architecture.md.",
            ],
          },
          {
            title: "Infrastructure",
            steps: [
              "Define boot architecture (config source, load sequence) in boot-architecture.md.",
              "Define update architecture (A/B images, recovery) in update-architecture.md.",
            ],
          },
        ],
      },
      {
        id: "T05.2",
        title: "Partitioning",
        objective: "Decide the processing element partition.",
        subtasks: [
          {
            title: "Options",
            steps: [
              "Evaluate FPGA, MCU, CPU, DSP, ASIC, GPU, hardware accelerator, and co-processors.",
              "Score each option against cost, power, performance, and flexibility.",
            ],
          },
          {
            title: "Decision",
            steps: [
              "Choose the partition and document rationale in partitioning.md.",
              "Define the FPGA/software interface (memory map, interrupts, DMA).",
            ],
          },
        ],
      },
      {
        id: "T05.3",
        title: "Quantitative estimates",
        objective: "Produce first-pass engineering calculations.",
        subtasks: [
          {
            title: "Bandwidth and latency",
            steps: [
              "Calculate PCIe bandwidth (gen/lanes) and Ethernet bandwidth (line rate vs payload).",
              "Calculate DDR bandwidth (bus width x clock x efficiency) and video bandwidth.",
              "Estimate end-to-end latency budgets for critical paths.",
            ],
          },
          {
            title: "FPGA resource estimates",
            steps: [
              "Estimate logic utilization, DSP usage, BRAM, URAM, transceivers.",
              "Consolidate all calculations in calculations.md with formulas and assumptions.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 06 — Interface Definition
  // ---------------------------------------------------------------------------
  {
    id: "06-interface-definition",
    num: 6,
    name: "Interface Definition",
    group: "design",
    description:
      "Define every external and internal interface: electrical, logical, protocol, and mechanical. The authoritative interface contract used by hardware, RTL, firmware, and software.",
    contextFiles: [
      "06-interface-definition/interfaces.md",
      "06-interface-definition/interface-spec.md",
      "06-interface-definition/pin-assignment.md",
    ],
    gates: [
      "All external interfaces specified (electrical, logical, protocol, mechanical)",
      "Interface spec reviewed and approved",
      "Pin assignment captured",
      "Interface decision logged",
    ],
    decisions: ["DECISION-060 — Interface set, protocols, and pin strategy"],
    reviews: ["architecture"],
    dependsOn: ["05-system-architecture"],
    tasks: [
      {
        id: "T06.1",
        title: "Interface inventory",
        objective: "Enumerate and specify every interface.",
        subtasks: [
          {
            title: "External interfaces",
            steps: [
              "List all external interfaces (PCIe, Ethernet, USB, UART, SPI, I2C, MIPI, JESD204, HDMI/DP, GPIO, sensors).",
              "Specify electrical characteristics (voltage, speed, termination) and protocol for each.",
            ],
          },
          {
            title: "Internal interfaces",
            steps: [
              "Define FPGA-to-FPGA, FPGA-to-MCU, FPGA-to-memory interfaces.",
              "Define the register/memory map shared with firmware and software.",
            ],
          },
        ],
      },
      {
        id: "T06.2",
        title: "Pin and signaling plan",
        objective: "Produce the pin and signaling plan.",
        subtasks: [
          {
            title: "Pin assignment",
            steps: [
              "Create the FPGA pin assignment for all interfaces.",
              "Verify bank/IO-standard compatibility.",
              "Document the pin assignment for hardware and RTL use.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 07 — FPGA Selection
  // ---------------------------------------------------------------------------
  {
    id: "07-fpga-selection",
    num: 7,
    name: "FPGA Selection",
    group: "design",
    description: "Select the FPGA with a rigorous criteria and vendor trade study.",
    contextFiles: ["07-fpga-selection/fpga-selection.md", "07-fpga-selection/selection-matrix.md"],
    gates: [
      "Selection criteria defined and scored",
      "Vendor trade study completed",
      "FPGA part selected with rationale",
      "Open-source toolchain support confirmed (or fallback defined)",
    ],
    decisions: ["DECISION-070 — FPGA part selection"],
    reviews: ["architecture", "hardware"],
    dependsOn: ["05-system-architecture", "06-interface-definition"],
    tasks: [
      {
        id: "T07.1",
        title: "Selection criteria",
        objective: "Define and score selection criteria.",
        subtasks: [
          {
            title: "Resource criteria",
            steps: [
              "Score logic cells, DSP slices, BRAM, URAM against architecture estimates.",
              "Score transceivers, PCIe support, DDR controllers, AI engines.",
              "Score clock managers and IO standards required.",
            ],
          },
          {
            title: "Physical and commercial criteria",
            steps: [
              "Evaluate package, power, and temperature grade (industrial/automotive/military).",
              "Evaluate availability, longevity, and vendor support.",
            ],
          },
        ],
      },
      {
        id: "T07.2",
        title: "Vendor trade study",
        objective: "Compare major FPGA vendors.",
        subtasks: [
          {
            title: "Vendor comparison",
            steps: [
              "Compare AMD Xilinx, Intel PSG, Lattice, Microchip PolarFire, Efinix, Gowin, QuickLogic.",
              "Score each vendor on toolchain quality, OSS support, availability, and cost.",
              "Populate selection-matrix.md with weighted scores.",
            ],
          },
          {
            title: "Selection",
            steps: [
              "Select the FPGA part and document the decision with rationale.",
              "Confirm open-source toolchain support (or define the fallback) for the chosen part.",
              "Note part-specific design considerations for later phases.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 08 — Component Selection
  // ---------------------------------------------------------------------------
  {
    id: "08-component-selection",
    num: 8,
    name: "Component Selection",
    group: "design",
    description: "Select all major components (memory, transceivers, PMIC, PHY, ADCs) and build the BOM draft with suppliers and lifecycle assessment.",
    contextFiles: [
      "08-component-selection/component-selection.md",
      "08-component-selection/BOM-draft.md",
      "08-component-selection/AVL.md",
    ],
    gates: [
      "All major components selected and justified",
      "BOM draft created with part numbers and suppliers",
      "Approved Vendor List (AVL) started",
      "Lifecycle/obsolescence risk noted per critical component",
    ],
    decisions: ["DECISION-080 — Component selections and BOM draft"],
    reviews: ["hardware"],
    dependsOn: ["06-interface-definition", "07-fpga-selection"],
    tasks: [
      {
        id: "T08.1",
        title: "Major component selection",
        objective: "Select memory, PHYs, power, and analog components.",
        subtasks: [
          {
            title: "Memory",
            steps: [
              "Select DDR/memory parts matching the memory architecture.",
              "Select boot/config flash (SPI/QSPI) and any EEPROM.",
            ],
          },
          {
            title: "Support ICs",
            steps: [
              "Select PMIC/regulators and voltage supervisors.",
              "Select Ethernet/USB PHY, ADC/DAC, and sensor parts.",
              "Select clock oscillators/buffers.",
            ],
          },
        ],
      },
      {
        id: "T08.2",
        title: "BOM and lifecycle",
        objective: "Build the BOM draft and assess lifecycle.",
        subtasks: [
          {
            title: "BOM draft",
            steps: [
              "Assemble the BOM draft with manufacturer part numbers, package, and estimated cost.",
              "Record alternate parts and suppliers in AVL.md.",
            ],
          },
          {
            title: "Lifecycle",
            steps: [
              "Assess component lifecycle status and lead times.",
              "Flag critical single-source components for obsolescence mitigation.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 09 — Hardware Architecture
  // ---------------------------------------------------------------------------
  {
    id: "09-hardware-architecture",
    num: 9,
    name: "Hardware Architecture",
    group: "design",
    description: "Board-level hardware architecture: board partitioning, assets, and interface assignment that drives PCB and each hardware-subsystem architecture.",
    contextFiles: ["09-hardware-architecture/hardware-architecture.md"],
    gates: [
      "Board architecture reviewed",
      "Board partitioning and asset allocation completed",
      "Interface-to-block assignment complete",
      "Hardware architecture decision logged",
    ],
    decisions: ["DECISION-090 — Board architecture and asset allocation"],
    reviews: ["hardware"],
    dependsOn: ["07-fpga-selection", "08-component-selection"],
    tasks: [
      {
        id: "T09.1",
        title: "Board architecture",
        objective: "Define the board-level architecture.",
        subtasks: [
          {
            title: "Partitioning",
            steps: [
              "Partition the board into functional blocks (power, clock, memory, I/O, processing).",
              "Allocate FPGA I/O banks and package pins to blocks.",
            ],
          },
          {
            title: "Assets",
            steps: [
              "Document board assets: connectors, LEDs, test points, debug header.",
              "Define assembly/enclosure constraints.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10 — PCB Architecture
  // ---------------------------------------------------------------------------
  {
    id: "10-pcb-architecture",
    num: 10,
    name: "PCB Architecture",
    group: "design",
    description: "PCB stackup and layout strategy defined before detailed design: layer stack, controlled impedance, routing families, and SI/PI/EMC approach.",
    contextFiles: ["10-pcb-architecture/stackup.md", "10-pcb-architecture/pcb-architecture.md"],
    gates: [
      "Stackup defined with controlled impedance layers",
      "Routing families and length-matching strategy defined",
      "SI/PI/EMC approach documented",
    ],
    decisions: ["DECISION-100 — PCB stackup and routing strategy"],
    reviews: ["hardware"],
    dependsOn: ["09-hardware-architecture"],
    tasks: [
      {
        id: "T10.1",
        title: "Stackup and strategy",
        objective: "Define the PCB stackup and layout strategy.",
        subtasks: [
          {
            title: "Stackup",
            steps: [
              "Define layer stackup with controlled impedance layers.",
              "Plan ground planes, power planes, and return paths.",
              "Design via optimization (type, size, placement).",
            ],
          },
          {
            title: "Routing strategy",
            steps: [
              "Define routing families and length-matching rules for each interface.",
              "Define decoupling capacitor placement rules.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11 — Power Architecture
  // ---------------------------------------------------------------------------
  {
    id: "11-power-architecture",
    num: 11,
    name: "Power Architecture",
    group: "design",
    description: "Power rail architecture, sequencing, estimation, and margin analysis that constrains hardware and RTL.",
    contextFiles: ["11-power-architecture/power-architecture.md", "11-power-architecture/power-estimate.md"],
    gates: [
      "Power architecture reviewed (power review)",
      "Rail list, sequencing, and regulator selection documented",
      "Power estimate completed and within budget",
    ],
    decisions: ["DECISION-110 — Power architecture and regulators"],
    reviews: ["power"],
    dependsOn: ["05-system-architecture", "08-component-selection"],
    tasks: [
      {
        id: "T11.1",
        title: "Power design",
        objective: "Design the power architecture.",
        subtasks: [
          {
            title: "Rails",
            steps: [
              "Define the rail list with voltages, loads, and tolerances.",
              "Design power sequencing and supervisor strategy.",
              "Select regulators/PMIC per rail.",
            ],
          },
          {
            title: "Estimate",
            steps: [
              "Estimate static and dynamic power for FPGA and board.",
              "Verify total power and thermal budget.",
              "Document margin and worst-case analysis.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 12 — Clock Architecture
  // ---------------------------------------------------------------------------
  {
    id: "12-clock-architecture",
    num: 12,
    name: "Clock Architecture",
    group: "design",
    description: "Clock generation, distribution, domains, and jitter budget. Defines all CDC domains consumed by RTL.",
    contextFiles: ["12-clock-architecture/clock-architecture.md", "12-clock-architecture/clock-domains.md"],
    gates: [
      "Clock tree and generation designed",
      "All clock domains and CDCs enumerated",
      "Jitter/uncertainty budget completed",
    ],
    decisions: ["DECISION-120 — Clock tree and CDC plan"],
    reviews: ["architecture", "rtl"],
    dependsOn: ["05-system-architecture", "09-hardware-architecture"],
    tasks: [
      {
        id: "T12.1",
        title: "Clock tree",
        objective: "Design clock generation and distribution.",
        subtasks: [
          {
            title: "Generation",
            steps: [
              "Select oscillators and design clock distribution.",
              "Design PLL/MMCM usage and configuration for each required frequency.",
              "Define clock gating and enables.",
            ],
          },
          {
            title: "Domains and CDCs",
            steps: [
              "Enumerate every clock domain and each CDC crossing.",
              "Budget clock uncertainty and jitter.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 13 — Reset Architecture
  // ---------------------------------------------------------------------------
  {
    id: "13-reset-architecture",
    num: 13,
    name: "Reset Architecture",
    group: "design",
    description: "Reset strategy: async vs sync, reset domains, deassertion synchronization, and reset tree. Consumed by RTL implementation.",
    contextFiles: ["13-reset-architecture/reset-architecture.md"],
    gates: [
      "Reset strategy defined and reviewed",
      "Reset domains and deassertion synchronization specified",
      "Reset tree and timing handled",
    ],
    decisions: ["DECISION-130 — Reset strategy"],
    reviews: ["rtl"],
    dependsOn: ["05-system-architecture"],
    tasks: [
      {
        id: "T13.1",
        title: "Reset strategy",
        objective: "Define the reset architecture.",
        subtasks: [
          {
            title: "Strategy",
            steps: [
              "Choose async vs synchronous reset per domain.",
              "Define reset domains and deassertion synchronization.",
              "Design reset distribution and handling in the tree.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 14 — Security Architecture
  // ---------------------------------------------------------------------------
  {
    id: "14-security-architecture",
    num: 14,
    name: "Security Architecture",
    group: "design",
    description: "Threat model and security architecture: secure boot, crypto, key management, anti-tamper, and debug lock. Drives hardware and firmware security implementation.",
    contextFiles: [
      "14-security-architecture/security-architecture.md",
      "14-security-architecture/threat-model.md",
      "14-security-architecture/key-management.md",
    ],
    gates: [
      "Threat model completed",
      "Security architecture reviewed (security review)",
      "Key management and lifecycle defined",
      "Debug and test access policy defined",
    ],
    decisions: ["DECISION-140 — Security architecture and key management"],
    reviews: ["security"],
    dependsOn: ["03-requirements", "05-system-architecture"],
    tasks: [
      {
        id: "T14.1",
        title: "Threat model",
        objective: "Model threats and trust boundaries.",
        subtasks: [
          {
            title: "Threat analysis",
            steps: [
              "Identify assets, trust boundaries, and adversaries.",
              "Enumerate attack surfaces and rank threats.",
            ],
          },
        ],
      },
      {
        id: "T14.2",
        title: "Security design",
        objective: "Define the security architecture.",
        subtasks: [
          {
            title: "Boot and crypto",
            steps: [
              "Design secure boot and authenticated firmware/bitstream.",
              "Select crypto (AES, RSA, ECC, SHA, TRNG) and key storage.",
              "Design key provisioning and lifecycle management.",
            ],
          },
          {
            title: "Tamper and access",
            steps: [
              "Design anti-tamper detection and response.",
              "Define debug lock and JTAG policy.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 15 — Thermal Architecture
  // ---------------------------------------------------------------------------
  {
    id: "15-thermal-architecture",
    num: 15,
    name: "Thermal Architecture",
    group: "design",
    description: "Thermal analysis and cooling strategy: heat dissipation, airflow, heatsink selection, and thermal simulation plan.",
    contextFiles: ["15-thermal-architecture/thermal-architecture.md"],
    gates: [
      "Thermal analysis completed at worst-case ambient",
      "Cooling strategy (passive/active) defined",
      "Junction temperatures verified within limits",
    ],
    decisions: ["DECISION-150 — Thermal and cooling strategy"],
    reviews: ["power"],
    dependsOn: ["11-power-architecture"],
    tasks: [
      {
        id: "T15.1",
        title: "Thermal design",
        objective: "Define the cooling strategy.",
        subtasks: [
          {
            title: "Analysis",
            steps: [
              "Estimate total dissipation at worst-case ambient.",
              "Select heatsink/cooling approach and verify junction temperature.",
              "Document airflow, fan control, and thermal vias.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 16 — Software Architecture
  // ---------------------------------------------------------------------------
  {
    id: "16-software-architecture",
    num: 16,
    name: "Software Architecture",
    group: "design",
    description: "Host/embedded software architecture: platform choice, drivers, services, and the FPGA software interface (memory map, interrupts, DMA).",
    contextFiles: [
      "16-software-architecture/software-architecture.md",
      "16-software-architecture/fpga-sw-interface.md",
      "16-software-architecture/api.md",
    ],
    gates: [
      "Software platform (bare metal/RTOS/Linux/Zephyr) selected",
      "FPGA/software interface (memory map, interrupts, DMA) defined",
      "API and SDK approach documented",
    ],
    decisions: ["DECISION-160 — Software platform and FPGA interface"],
    reviews: ["architecture"],
    dependsOn: ["05-system-architecture"],
    tasks: [
      {
        id: "T16.1",
        title: "Platform",
        objective: "Choose the software platform.",
        subtasks: [
          {
            title: "RTOS selection",
            steps: [
              "Choose between bare metal, FreeRTOS, Linux, Zephyr, RTEMS.",
              "Set up cross-compile toolchain and build system approach.",
            ],
          },
          {
            title: "Services",
            steps: [
              "Define drivers, networking, filesystem, CLI, telemetry services.",
              "Define OTA update strategy at software level.",
            ],
          },
        ],
      },
      {
        id: "T16.2",
        title: "FPGA software interface",
        objective: "Define and implement the FPGA/software boundary.",
        subtasks: [
          {
            title: "Interface",
            steps: [
              "Define the memory map and register design.",
              "Implement interrupts and DMA.",
              "Implement shared memory, mailbox, and RPC.",
            ],
          },
          {
            title: "SDK and docs",
            steps: [
              "Define the command interface and public API.",
              "Provide SDK and documentation for application developers.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 17 — Firmware Architecture
  // ---------------------------------------------------------------------------
  {
    id: "17-firmware-architecture",
    num: 17,
    name: "Firmware Architecture",
    group: "design",
    description: "Firmware architecture for boot, configuration, diagnostics, and security, plus the hardware abstraction layer.",
    contextFiles: ["17-firmware-architecture/firmware-architecture.md", "17-firmware-architecture/hal.md"],
    gates: [
      "Firmware architecture reviewed",
      "Boot/init sequence defined",
      "HAL and diagnostics approach defined",
    ],
    decisions: ["DECISION-170 — Firmware architecture and boot sequence"],
    reviews: ["architecture"],
    dependsOn: ["14-security-architecture", "16-software-architecture"],
    tasks: [
      {
        id: "T17.1",
        title: "Firmware architecture",
        objective: "Define firmware structure.",
        subtasks: [
          {
            title: "Boot and services",
            steps: [
              "Define bootloader and configuration load sequence.",
              "Define power management, watchdog, logging, and update services.",
              "Define the hardware abstraction layer (HAL) boundary.",
            ],
          },
          {
            title: "Security",
            steps: [
              "Map secure boot and key handling into firmware.",
              "Define diagnostics and self-test services.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 18 — RTL Architecture
  // ---------------------------------------------------------------------------
  {
    id: "18-rtl-architecture",
    num: 18,
    name: "RTL Architecture",
    group: "design",
    description: "Micro-architecture and design spec for every module: interface contracts, datapath, FSM structure, and module index, before coding begins.",
    contextFiles: [
      "18-rtl-architecture/design-spec.md",
      "18-rtl-architecture/module-index.md",
      "18-rtl-architecture/microarchitecture.md",
    ],
    gates: [
      "Design spec produced for every module",
      "Module index and interface contracts defined",
      "RTL architecture reviewed",
    ],
    decisions: ["DECISION-180 — Micro-architecture and module decomposition"],
    reviews: ["rtl", "architecture"],
    dependsOn: ["05-system-architecture", "12-clock-architecture", "13-reset-architecture", "14-security-architecture"],
    tasks: [
      {
        id: "T18.1",
        title: "Micro-architecture",
        objective: "Specify module interfaces and internal structure.",
        subtasks: [
          {
            title: "Module decomposition",
            steps: [
              "Decompose the design into modules and define the hierarchy.",
              "Write a design spec per module: function, I/O, states, timing.",
              "Build the module index with dependencies.",
            ],
          },
          {
            title: "Interface contracts",
            steps: [
              "Define clock domains, resets, and handshake for each module.",
              "Define the register map per module.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 19 — Verification Plan
  // ---------------------------------------------------------------------------
  {
    id: "19-verification-plan",
    num: 19,
    name: "Verification Plan",
    group: "verify",
    description:
      "Verification strategy and test plan: levels, methodology, tooling, coverage goals, and sign-off criteria. Verification is 60-80% of project effort.",
    contextFiles: [
      "19-verification-plan/verification-plan.md",
      "19-verification-plan/test-plan.md",
      "19-verification-plan/coverage-goals.md",
    ],
    gates: [
      "Verification plan reviewed (verification review)",
      "Test plan covers all requirements and interfaces",
      "Coverage goals and sign-off criteria defined",
      "Tooling (OSS simulators/formal) selected",
    ],
    decisions: ["DECISION-190 — Verification methodology and tooling"],
    reviews: ["verification"],
    dependsOn: ["03-requirements", "18-rtl-architecture"],
    tasks: [
      {
        id: "T19.1",
        title: "Verification strategy",
        objective: "Define the verification approach.",
        subtasks: [
          {
            title: "Levels and methodology",
            steps: [
              "Define levels: unit, module, subsystem, system, regression.",
              "Define directed, random, and coverage-driven test plans.",
              "Choose open-source languages/tools: SystemVerilog, UVM, Cocotb, Verilator, iverilog, yosys.",
            ],
          },
          {
            title: "Tooling",
            steps: [
              "Set up the simulation flow (Makefile/script) with open-source simulators.",
              "Set up formal verification with SymbiYosys (Yosys-SMT).",
              "Document how paid tools (Questa, Vivado, VCS) plug in via adapters.",
            ],
          },
        ],
      },
      {
        id: "T19.2",
        title: "Test plan",
        objective: "Write the detailed test plan.",
        subtasks: [
          {
            title: "Coverage",
            steps: [
              "Map every requirement to test cases with coverage goals.",
              "Define functional coverage groups and assertions needed.",
              "Define sign-off criteria for verification complete.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 20 — Implementation
  // ---------------------------------------------------------------------------
  {
    id: "20-implementation",
    num: 20,
    name: "Implementation",
    group: "implement",
    description: "Complete, professional, industrial-grade RTL/HDL coding with strict coding standards and all required modules.",
    contextFiles: [
      "20-implementation/coding-standards.md",
      "20-implementation/rtl/",
      "20-implementation/ip/",
    ],
    gates: [
      "RTL lint clean",
      "CDC clean",
      "Reset clean",
      "Parameterized and documented",
      "RTL reviewed (rtl review)",
      "Module index complete with no missing modules",
    ],
    decisions: ["DECISION-200 — HDL language and coding standards baseline"],
    reviews: ["rtl"],
    dependsOn: ["18-rtl-architecture"],
    tasks: [
      {
        id: "T20.1",
        title: "Language and standards",
        objective: "Choose HDL and establish coding standards.",
        subtasks: [
          {
            title: "Language selection",
            steps: [
              "Ask the user for the HDL; if unspecified, recommend SystemVerilog (industry default for new designs).",
              "Confirm alternatives: VHDL, Verilog, Chisel, SpinalHDL, Bluespec.",
              "Record the decision in coding-standards.md.",
            ],
          },
          {
            title: "Coding standards",
            steps: [
              "Define naming conventions, hierarchy rules, and comment standards.",
              "Define parameterization and reusable module guidelines.",
              "Define clock-enable, synchronous-logic, and reset strategy rules.",
              "Define CDC safety rules (synchronizers, async FIFOs, handshake).",
            ],
          },
        ],
      },
      {
        id: "T20.2",
        title: "Module implementation",
        objective: "Implement every required module to production quality.",
        subtasks: [
          {
            title: "Control and datapath",
            steps: [
              "Implement ALU, FIFO (sync + async), DMA, Interrupt controller, Timers, PWM.",
              "Implement UART, SPI, I2C with parameterized FIFOs.",
              "Implement AXI (AXI4/AXI-Lite) interfaces and memory controller.",
            ],
          },
          {
            title: "High-speed and processing",
            steps: [
              "Implement PCIe endpoint (or vendor IP wrapper) and Ethernet MAC.",
              "Implement video/image processing and DSP modules.",
              "Implement crypto, compression, and custom protocols.",
              "Implement ADC/DAC interface modules.",
            ],
          },
        ],
      },
      {
        id: "T20.3",
        title: "Digital design techniques",
        objective: "Apply best-practice techniques throughout.",
        subtasks: [
          {
            title: "Architecture",
            steps: [
              "Design FSMs with proper encoding; use pipelines and parallelism.",
              "Apply latency, area, and power optimizations; resource sharing and retiming.",
            ],
          },
          {
            title: "Primitives",
            steps: [
              "Infer BRAM/URAM/distributed RAM and shift registers correctly.",
              "Implement multipliers, MACs, fixed/floating point, CORDIC.",
              "Implement filters, FFT, DCT, CRC, and ECC.",
            ],
          },
          {
            title: "Verification hooks",
            steps: [
              "Add synthesis assertions and debug infrastructure.",
              "Ensure every module has a corresponding testbench entry.",
              "Verify completeness against module-index.md; create new tasks for any missing module.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 21 — Testbench
  // ---------------------------------------------------------------------------
  {
    id: "21-testbench",
    num: 21,
    name: "Testbench",
    group: "verify",
    description: "Build reusable, UVM/classic/Cocotb testbenches with drivers, monitors, scoreboards, and checkers.",
    contextFiles: ["21-testbench/tb/", "21-testbench/testbench-architecture.md"],
    gates: [
      "Testbench infrastructure built and reusable",
      "Drivers/monitors/scoreboards/checkers present per module",
      "Testbench reviewed",
    ],
decisions: ["DECISION-210 — Testbench architecture and reuse strategy"],
    reviews: ["verification"],
    dependsOn: ["19-verification-plan", "20-implementation"],
    tasks: [
      {
        id: "T21.1",
        title: "Testbench infrastructure",
        objective: "Build reusable testbenches.",
        subtasks: [
          {
            title: "Base infrastructure",
            steps: [
              "Create drivers, monitors, scoreboards, and checkers per module.",
              "Build sequence generation and randomization harness.",
              "Create directed test cases for all functional requirements.",
            ],
          },
          {
            title: "Assertions",
            steps: [
              "Write SVA assertions for protocol, interface, and invariant properties.",
              "Add assertion-based testbench hooks.",
              "Document assertion coverage.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 22 — Simulation
  // ---------------------------------------------------------------------------
  {
    id: "22-simulation",
    num: 22,
    name: "Simulation",
    group: "verify",
    description: "Run the regression suite, measure coverage, and close coverage gaps using open-source simulators.",
    contextFiles: ["22-simulation/simulation.md", "22-simulation/coverage.md", "22-simulation/regression.md"],
    gates: [
      "Regression suite runs deterministically",
      "Coverage goals met (code, functional, toggle, FSM, assertion)",
      "Coverage gaps closed or justified",
      "Simulation sign-off recorded",
    ],
decisions: ["DECISION-220 — Simulation regression sign-off"],
    reviews: ["verification"],
    dependsOn: ["21-testbench"],
    tasks: [
      {
        id: "T22.1",
        title: "Coverage and regression",
        objective: "Measure and close coverage.",
        subtasks: [
          {
            title: "Coverage",
            steps: [
              "Measure code, functional, toggle, FSM, and assertion coverage.",
              "Identify coverage gaps and add tests to close them.",
              "Report coverage metrics in coverage.md.",
            ],
          },
          {
            title: "Regression",
            steps: [
              "Automate the regression suite and make it deterministic.",
              "Run the full suite on every change; publish results.",
              "Run static verification (lint) and formal verification on critical blocks.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 23 — Formal Verification
  // ---------------------------------------------------------------------------
  {
    id: "23-formal-verification",
    num: 23,
    name: "Formal Verification",
    group: "verify",
    description: "Formal verification of critical blocks with SymbiYosys: equivalence, bounded model checking, and property proofs.",
    contextFiles: ["23-formal-verification/formal-verification.md", "23-formal-verification/properties.sv"],
    gates: [
      "Formal properties defined for critical blocks",
      "BMC/proofs run and pass",
      "Formal sign-off documented",
    ],
decisions: ["DECISION-230 — Formal verification scope and sign-off"],
    reviews: ["verification"],
    dependsOn: ["22-simulation"],
    tasks: [
      {
        id: "T23.1",
        title: "Formal properties",
        objective: "Prove critical behavior formally.",
        subtasks: [
          {
            title: "Properties",
            steps: [
              "Write formal properties for FSMs, CDC, and critical datapaths.",
              "Run BMC with SymbiYosys and resolve counterexamples.",
            ],
          },
          {
            title: "Sign-off",
            steps: [
              "Document proven properties and coverage.",
              "Record formal sign-off.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 24 — Synthesis
  // ---------------------------------------------------------------------------
  {
    id: "24-synthesis",
    num: 24,
    name: "Synthesis",
    group: "implement",
    description: "Synthesis with Yosys (or vendor flow), lint-clean netlist, and resource utilization assessment.",
    contextFiles: ["24-synthesis/synthesis.md", "24-synthesis/utilization.md", "24-synthesis/netlist/"],
    gates: [
      "Synthesis completes cleanly",
      "Resource utilization within budget",
      "Synthesis netlist archived",
    ],
decisions: ["DECISION-240 — Synthesis flow and target utilization"],
    reviews: ["timing"],
    dependsOn: ["20-implementation"],
    tasks: [
      {
        id: "T24.1",
        title: "Synthesis",
        objective: "Run and review synthesis.",
        subtasks: [
          {
            title: "Flow",
            steps: [
              "Set up the Yosys synthesis flow (or vendor flow via adapter).",
              "Run synthesis and review warnings/errors.",
              "Record utilization vs budget.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 25 — Place & Route
  // ---------------------------------------------------------------------------
  {
    id: "25-place-and-route",
    num: 25,
    name: "Place & Route",
    group: "implement",
    description: "Placement and routing (nextpnr or vendor flow), congestion, and bitstream generation.",
    contextFiles: ["25-place-and-route/place-and-route.md", "25-place-and-route/bitstream/"],
    gates: [
      "P&R completes without errors",
      "Congestion and routability acceptable",
      "Bitstream generated",
    ],
decisions: ["DECISION-250 — P&R flow and bitstream generation"],
    reviews: ["timing"],
    dependsOn: ["24-synthesis"],
    tasks: [
      {
        id: "T25.1",
        title: "Place and route",
        objective: "Place, route, and generate the bitstream.",
        subtasks: [
          {
            title: "P&R",
            steps: [
              "Run placement and routing (nextpnr or vendor flow).",
              "Review congestion, timing, and resource utilization.",
              "Generate and archive the bitstream.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 26 — Timing Closure
  // ---------------------------------------------------------------------------
  {
    id: "26-timing-closure",
    num: 26,
    name: "Timing Closure",
    group: "implement",
    description: "Static timing analysis, constraints, optimization, and reports.",
    contextFiles: ["26-timing-closure/constraints.xdc", "26-timing-closure/timing-report.md"],
    gates: [
      "Constraints complete and reviewed",
      "WNS/TNS and hold/setup violations resolved",
      "Timing sign-off reports archived",
    ],
decisions: ["DECISION-260 — Timing sign-off"],
    reviews: ["timing"],
    dependsOn: ["25-place-and-route"],
    tasks: [
      {
        id: "T26.1",
        title: "Constraints",
        objective: "Write complete timing constraints.",
        subtasks: [
          {
            title: "SDC/XDC",
            steps: [
              "Define clocks, generated clocks, and clock groups.",
              "Define input/output delays on all interfaces.",
              "Define false paths, multicycle paths, and timing exceptions.",
            ],
          },
          {
            title: "Review",
            steps: [
              "Verify constraints cover all clocks and interfaces.",
              "Document all constraints in timing-report.md.",
            ],
          },
        ],
      },
      {
        id: "T26.2",
        title: "Optimization",
        objective: "Achieve timing closure.",
        subtasks: [
          {
            title: "Techniques",
            steps: [
              "Apply pipelining and register balancing.",
              "Use floorplanning, placement, and routing guidance.",
              "Apply clock optimization, logic replication, and fanout reduction.",
            ],
          },
          {
            title: "Iterate",
            steps: [
              "Run synthesis and P&R; review WNS, TNS, setup/hold violations.",
              "Fix critical paths and re-run until closure.",
              "Check routing congestion and clock utilization.",
            ],
          },
        ],
      },
      {
        id: "T26.3",
        title: "Reports",
        objective: "Generate complete timing reports.",
        subtasks: [
          {
            title: "Report generation",
            steps: [
              "Produce timing summary: WNS, TNS, hold violations, setup violations.",
              "Produce clock utilization and routing congestion reports.",
              "Archive signed-off timing reports in 26-timing-closure/.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 27 — Optimization
  // ---------------------------------------------------------------------------
  {
    id: "27-optimization",
    num: 27,
    name: "Optimization",
    group: "implement",
    description: "Post-P&R optimization of performance, area, and power with measurement and iteration.",
    contextFiles: ["27-optimization/performance-report.md", "27-optimization/optimization-log.md"],
    gates: [
      "Performance targets met (latency, bandwidth, throughput)",
      "Power and area within budget",
      "Optimization results documented",
    ],
decisions: ["DECISION-270 — Optimization targets and results"],
    reviews: ["timing", "power"],
    dependsOn: ["26-timing-closure"],
    tasks: [
      {
        id: "T27.1",
        title: "Optimization",
        objective: "Hit performance targets.",
        subtasks: [
          {
            title: "Throughput and latency",
            steps: [
              "Measure latency and bandwidth against requirements.",
              "Optimize pipeline depth, caches, and burst transfers.",
              "Optimize memory, bus, and clock architecture.",
            ],
          },
          {
            title: "Power and area",
            steps: [
              "Reduce power via clock gating, power gating, and frequency scaling.",
              "Reduce area via resource sharing and efficient inference.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 28 — Debug
  // ---------------------------------------------------------------------------
  {
    id: "28-debug",
    num: 28,
    name: "Debug",
    group: "verify",
    description: "Debug infrastructure and tools: instrumentation, JTAG, logic analyzer, and software debug channels.",
    contextFiles: ["28-debug/debugging.md"],
    gates: [
      "Debug infrastructure built (ILA/SignalTap or OSS equivalent)",
      "JTAG and boundary scan ready",
      "Debug channels documented",
    ],
decisions: ["DECISION-280 — Debug infrastructure"],
    reviews: ["verification"],
    dependsOn: ["22-simulation", "25-place-and-route"],
    tasks: [
      {
        id: "T28.1",
        title: "Hardware debug",
        objective: "Set up in-circuit debug.",
        subtasks: [
          {
            title: "Instrumentation",
            steps: [
              "Integrate ILA (Vivado) or SignalTap (Quartus) cores for observability.",
              "Prepare JTAG access and boundary scan.",
              "Set up oscilloscope, logic analyzer, and protocol analyzer hooks.",
            ],
          },
          {
            title: "Software debug",
            steps: [
              "Implement UART/Ethernet/GPIO debug channels.",
              "Add performance counters for profiling.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 29 — System Validation
  // ---------------------------------------------------------------------------
  {
    id: "29-system-validation",
    num: 29,
    name: "System Validation",
    group: "verify",
    description: "HW + SW + FW integration and on-board system validation against requirements, including field-programmed bitstream.",
    contextFiles: ["29-system-validation/system-validation.md", "29-system-validation/validation-report.md"],
    gates: [
      "Integration test plan executed",
      "On-board validation against requirements passed",
      "Issues logged and resolved/waived",
      "Validation report approved",
    ],
    decisions: ["DECISION-290 — System validation results acceptance"],
    reviews: ["verification"],
    dependsOn: ["26-timing-closure", "27-optimization", "28-debug"],
    tasks: [
      {
        id: "T29.1",
        title: "Integration",
        objective: "Integrate and validate the full system.",
        subtasks: [
          {
            title: "HW/SW/FW integration",
            steps: [
              "Bring up hardware and validate power, clocks, and resets.",
              "Integrate firmware and software with the FPGA.",
              "Run end-to-end system tests against requirements.",
            ],
          },
          {
            title: "Validation",
            steps: [
              "Execute the integration test plan and record results.",
              "Measure performance, power, and reliability in the field context.",
              "Log issues with severity and close or waive them.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 30 — Manufacturing
  // ---------------------------------------------------------------------------
  {
    id: "30-manufacturing",
    num: 30,
    name: "Manufacturing",
    group: "produce",
    description: "Manufacturing planning and control: BOM, supply chain, fabrication, assembly, and traceability.",
    contextFiles: ["30-manufacturing/manufacturing.md", "30-manufacturing/BOM.md"],
    gates: [
      "BOM finalized with AVL and alternates",
      "Fabrication and assembly flow defined",
      "Inspection and test plans defined",
      "Traceability plan in place",
    ],
decisions: ["DECISION-300 — Manufacturing and assembly strategy"],
    reviews: ["manufacturing"],
    dependsOn: ["08-component-selection", "29-system-validation"],
    tasks: [
      {
        id: "T30.1",
        title: "Supply chain",
        objective: "Manage BOM and components.",
        subtasks: [
          {
            title: "BOM",
            steps: [
              "Create and maintain the BOM with Approved Vendor List.",
              "Track component lifecycle and obsolescence.",
            ],
          },
          {
            title: "Procurement",
            steps: [
              "Validate lead times and dual-sourcing.",
              "Document component risk and alternates.",
            ],
          },
        ],
      },
      {
        id: "T30.2",
        title: "Assembly process",
        objective: "Define fabrication and assembly flow.",
        subtasks: [
          {
            title: "Fabrication",
            steps: [
              "Define PCB fabrication and stencil requirements.",
              "Define assembly and soldering process.",
            ],
          },
          {
            title: "Inspection",
            steps: [
              "Plan AOI, SPI, and X-ray inspection.",
              "Plan ICT and boundary scan testing.",
              "Define functional testing, calibration, programming, serialization.",
            ],
          },
          {
            title: "Traceability",
            steps: [
              "Implement labeling and packaging.",
              "Implement unit-level traceability.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 31 — Production Testing
  // ---------------------------------------------------------------------------
  {
    id: "31-production-testing",
    num: 31,
    name: "Production Testing",
    group: "produce",
    description: "Production test coverage, fixtures, and yield analysis.",
    contextFiles: ["31-production-testing/production-test.md", "31-production-testing/yield-analysis.md"],
    gates: [
      "Production test coverage defined",
      "ATE fixtures and scripts in place",
      "Yield baseline established",
    ],
decisions: ["DECISION-310 — Production test strategy"],
    reviews: ["manufacturing"],
    dependsOn: ["30-manufacturing"],
    tasks: [
      {
        id: "T31.1",
        title: "Test coverage",
        objective: "Define production tests.",
        subtasks: [
          {
            title: "Automated tests",
            steps: [
              "Set up Automated Test Equipment (ATE) fixtures and scripts.",
              "Implement boundary scan and JTAG testing.",
              "Implement power, clock, and DDR testing.",
            ],
          },
          {
            title: "Interface tests",
            steps: [
              "Implement Ethernet, PCIe, USB testing.",
              "Implement temperature, stress, and burn-in tests.",
            ],
          },
        ],
      },
      {
        id: "T31.2",
        title: "Yield analysis",
        objective: "Monitor and improve yield.",
        subtasks: [
          {
            title: "Analysis",
            steps: [
              "Collect test data and compute yield.",
              "Perform failure analysis and corrective action.",
              "Track yield trends in yield-analysis.md.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 32 — Compliance
  // ---------------------------------------------------------------------------
  {
    id: "32-compliance",
    num: 32,
    name: "Compliance",
    group: "produce",
    description: "Regulatory compliance and certification: EMI/EMC, safety, materials, and vertical-market requirements.",
    contextFiles: ["32-compliance/compliance.md", "32-compliance/compliance-matrix.md"],
    gates: [
      "Compliance matrix built from requirements",
      "EMI/EMC testing planned/executed",
      "RoHS/REACH and certifications tracked",
      "Compliance sign-off documented",
    ],
decisions: ["DECISION-320 — Compliance and certification plan"],
    reviews: ["manufacturing"],
    dependsOn: ["03-requirements", "29-system-validation"],
    tasks: [
      {
        id: "T32.1",
        title: "Certifications",
        objective: "Achieve required certifications.",
        subtasks: [
          {
            title: "Electromagnetic",
            steps: [
              "Plan and execute EMI/EMC testing.",
              "Pursue CE, FCC, UL as required.",
            ],
          },
          {
            title: "Materials and quality",
            steps: [
              "Ensure RoHS and REACH compliance.",
              "Pursue IEC/ISO certification as required.",
            ],
          },
          {
            title: "Vertical markets",
            steps: [
              "Handle automotive, medical, aerospace, railway, and defense requirements if applicable.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 33 — Documentation
  // ---------------------------------------------------------------------------
  {
    id: "33-documentation",
    num: 33,
    name: "Documentation",
    group: "produce",
    description: "Complete product documentation set: engineering, product, manufacturing, and maintenance.",
    contextFiles: ["33-documentation/documentation-index.md"],
    gates: [
      "Engineering documentation complete",
      "Product/manufacturing/maintenance docs complete",
      "Documentation reviewed by technical writer",
    ],
decisions: ["DECISION-330 — Documentation set baseline"],
    reviews: ["release"],
    dependsOn: ["29-system-validation", "32-compliance"],
    tasks: [
      {
        id: "T33.1",
        title: "Documentation set",
        objective: "Produce all required documents.",
        subtasks: [
          {
            title: "Engineering docs",
            steps: [
              "Write requirements, architecture, schematics, PCB, RTL, firmware, and software docs.",
              "Write test plans and verification plans.",
            ],
          },
          {
            title: "Product docs",
            steps: [
              "Write manufacturing instructions, service manual, and user manual.",
              "Write API documentation and release notes.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 34 — Release
  // ---------------------------------------------------------------------------
  {
    id: "34-release",
    num: 34,
    name: "Release",
    group: "produce",
    description:
      "Release management: versioning, milestones, snapshots/baselines, freeze, release candidates, hotfix and LTS planning, and the release review gate.",
    contextFiles: [
      "34-release/release-plan.md",
      "34-release/release-notes.md",
      "34-release/baseline.md",
    ],
    gates: [
      "Release plan with versioning and milestones approved",
      "Snapshot/baseline created and frozen",
      "Release review passed (release review)",
      "Release notes published",
    ],
    decisions: ["DECISION-340 — Release baseline and version"],
    reviews: ["release"],
    dependsOn: ["29-system-validation", "32-compliance", "33-documentation"],
    tasks: [
      {
        id: "T34.1",
        title: "Release planning",
        objective: "Plan and execute the release.",
        subtasks: [
          {
            title: "Versioning",
            steps: [
              "Define version numbering (semver or custom) and milestones.",
              "Create the release plan with dates and owners.",
            ],
          },
          {
            title: "Baseline and freeze",
            steps: [
              "Create the release snapshot/baseline (git tag) and freeze changes.",
              "Track release candidates, hotfixes, and maintenance releases.",
            ],
          },
        ],
      },
      {
        id: "T34.2",
        title: "Release sign-off",
        objective: "Close the release.",
        subtasks: [
          {
            title: "Review",
            steps: [
              "Run the release review gate (blocking findings resolved/waived).",
              "Publish release notes.",
              "Archive the signed-off release.",
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 35 — Field Support
  // ---------------------------------------------------------------------------
  {
    id: "35-field-support",
    num: 35,
    name: "Field Support",
    group: "sustain",
    description: "Field updates, diagnostics, telemetry, bug tracking, patch management, and end-of-life planning.",
    contextFiles: ["35-field-support/field-support.md", "35-field-support/telemetry.md"],
    gates: [
      "Field update channel implemented",
      "Remote diagnostics and telemetry defined",
      "Bug tracking and patch management process active",
      "End-of-life plan defined",
    ],
decisions: ["DECISION-350 — Field support and EOL plan"],
    reviews: ["release"],
    dependsOn: ["34-release"],
    tasks: [
      {
        id: "T35.1",
        title: "Field ops",
        objective: "Enable field support.",
        subtasks: [
          {
            title: "Updates",
            steps: [
              "Implement firmware and FPGA update channels.",
              "Implement remote diagnostics and telemetry.",
              "Implement crash logs and performance monitoring.",
            ],
          },
          {
            title: "Maintenance",
            steps: [
              "Implement predictive maintenance.",
              "Set up customer support, bug tracking, and patch management.",
              "Define end-of-life and migration planning.",
            ],
          },
        ],
      },
    ],
  },
]

export const PHASE_TITLES: Record<string, string> = Object.fromEntries(PHASES.map((p) => [p.id, p.name]))

export function findPhase(id: string): Phase | undefined {
  return PHASES.find((p) => p.id === id)
}

/** Lifecycle presets: "full" runs all 36 phases with blocking gates; "fast-proto" skips market/formal/manufacturing-heavy work and auto-approves gates. */
export type Preset = "full" | "fast-proto"

export function phaseInPreset(phase: Phase, preset: Preset): boolean {
  if (preset === "full") return true
  const skip = new Set(["02-market", "04-feasibility", "23-formal-verification", "30-manufacturing", "31-production-testing", "32-compliance"])
  return !skip.has(phase.id)
}

export const REVIEWS: Record<ReviewType, { title: string; description: string }> = {
  requirements: {
    title: "Requirements Review",
    description: "Verify requirements are complete, unambiguous, testable, and approved.",
  },
  architecture: {
    title: "Architecture Review",
    description: "Verify architecture meets requirements with sound trade-offs and recorded decisions.",
  },
  hardware: {
    title: "Hardware Review",
    description: "Verify hardware design against architecture, interfaces, and constraints.",
  },
  rtl: {
    title: "RTL Review",
    description: "Verify RTL correctness, coding standards, CDC/reset cleanliness, and lint results.",
  },
  verification: {
    title: "Verification Review",
    description: "Verify verification plan, coverage closure, and sign-off criteria.",
  },
  timing: {
    title: "Timing Review",
    description: "Verify constraints and timing closure with signed-off reports.",
  },
  power: {
    title: "Power Review",
    description: "Verify power budget, estimation, and thermal margin.",
  },
  security: {
    title: "Security Review",
    description: "Verify threat model, secure boot, crypto, and tamper resistance.",
  },
  manufacturing: {
    title: "Manufacturing Review",
    description: "Verify BOM, supply chain, DFM, and production readiness.",
  },
  release: {
    title: "Release Review",
    description: "Verify release readiness: baseline, documentation, and sign-off.",
  },
}
