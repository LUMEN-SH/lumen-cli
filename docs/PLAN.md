# v1 Plan — diagrams

Visual companion to [`ROADMAP.md`](../ROADMAP.md). `lc#` = `lumen-cli`,
`cl#` = `create-lumen`. All diagrams render on GitHub.

## 1. Functional milestones

```mermaid
flowchart LR
    M1["🧱 M1 · v1.0.0-alpha<br/>Core: CLI + config + create/init"]
    M2["🏗️ M2 · v1.0.0-alpha.2<br/>Generators"]
    M3["🎨 M3 · v1.0.0-beta<br/>UI registry"]
    M4["📚 M4 · v1.0.0-beta.2<br/>Docs engine"]
    M5["🩺 M5 · v1.0.0<br/>Doctor, barrels &amp; docs"]

    M1 -->|"npx lumen create my-app"| M2
    M2 -->|"lumen g &lt;artifact&gt; writes files"| M3
    M3 -->|"g ui resolves Registry/shadcn"| M4
    M4 -->|"docs generation works"| M5
    M5 -->|"v1.0.0 usable"| DONE(((✅)))
```

## 2. Target command surface

What the CLI exposes at `v1.0.0` (a command appears as its milestone
lands).

```mermaid
flowchart TD
    L["lumen"]
    L --> CREATE["create / init<br/>M1 · delegate to create-lumen@^2"]
    L --> CONFIG["config<br/>M1"]
    L --> G["generate / g<br/>M2"]
    L --> DOCTOR["doctor<br/>M5"]
    L --> SYNC["sync-barrels<br/>M5"]

    G --> FEAT["g feature<br/>M2"]
    G --> PAGE["g page<br/>M2"]
    G --> SVC["g service<br/>M2"]
    G --> STORE["g store<br/>M2"]
    G --> FORM["g form<br/>M2"]
    G --> UI["g ui &amp; g ui theme-*<br/>M3"]
```

## 3. Dependency graph (lumen-cli + cross-repo)

Solid = hard dependency. Dotted = dependency on `create-lumen`.

```mermaid
flowchart TD
    subgraph LC["lumen-cli v1"]
        lc1["#1 bootstrap"]
        lc2["#2 command framework"]
        lc3["#3 config reader"]
        lc4["#4 lumen config"]
        lc5["#5 create/init"]
        lc6["#6 forward flags"]
        lc7["#7 generator core"]
        lc8["#8 g feature"]
        lc11["#11 g page"]
        lc12["#12 g service"]
        lc13["#13 g store"]
        lc14["#14 g form"]
        lc9["#9 g ui"]
        lc10["#10 themes"]
        lc24["#24 port documentador"]
        lc16["#16 python bridge"]
        lc15["#15 api keys"]
        lc17["#17 TSDoc"]
        lc18["#18 wiki"]
        lc19["#19 --readme"]
        lc25["#25 co-located docs"]
        lc20["#20 doctor"]
        lc21["#21 sync-barrels"]

        lc1 --> lc2
        lc2 --> lc3 --> lc7
        lc3 --> lc4
        lc2 --> lc5 --> lc6
        lc7 --> lc8
        lc7 --> lc11
        lc7 --> lc12
        lc7 --> lc13
        lc7 --> lc14
        lc7 --> lc9 --> lc10
        lc7 --> lc21
        lc3 --> lc20
        lc7 --> lc20
        lc24 --> lc16
        lc16 --> lc15
        lc16 --> lc17
        lc16 --> lc18
        lc16 --> lc19
        lc16 --> lc25
    end

    subgraph CLEX["create-lumen v2 (external)"]
        cl9["#9 shared contract"]
        cl13["#13 nested schema"]
        cl33["#33 shadcn/ui"]
        clM1["M1 core (alpha)"]
    end

    cl9 -.-> lc3
    cl13 -.-> lc3
    cl33 -.-> lc9
    clM1 -.-> lc5
```

## 4. Cross-project waves (4 devs)

Everything in a wave can run at the same time; lanes are shared with
`create-lumen`.

```mermaid
flowchart TB
    subgraph W0["🌊 Wave 0 — start now (fully parallel)"]
        direction LR
        A["Lane A<br/>create-lumen manifest core<br/>cl#13 #14 #15 #16 #4"]
        B["Lane B<br/>templates / tooling<br/>cl#6 #24"]
        C["Lane C<br/>lumen-cli skeleton<br/>lc#1 #2"]
        D["Lane D<br/>docs-engine port<br/>lc#24 #16"]
        G["Lane G<br/>testing strategy<br/>cl#35 #36 #37 #28 #5"]
    end

    subgraph W1["🌊 Wave 1"]
        direction LR
        E["Lane E<br/>engine + options<br/>cl#25 #26 #27 #33 #34 #11"]
        H["Lane H<br/>lumen-cli generators<br/>lc#7 #8 #11–#14"]
    end

    subgraph W2["🌊 Wave 2"]
        direction LR
        F["Lane F<br/>Next.js<br/>cl#8 #18–#22"]
        I["Lane I<br/>UI registry<br/>lc#9 #10"]
        J["Lane J<br/>docs engine features<br/>lc#15 #17–#19 #25"]
        K["Lane K<br/>doctor / barrels<br/>lc#20 #21"]
    end

    subgraph W3["🌊 Wave 3 — release"]
        L["Lane L<br/>release &amp; docs<br/>cl#17 #30 · lc#22"]
    end

    A --> E --> F
    C --> H
    H --> I
    H --> K
    D --> J
    G -.-> L
    F --> L
    I --> L
    J --> L
    K --> L
```

Suggested split: **Dev 1** A→E→F · **Dev 2** B→G→L · **Dev 3**
C→H→I→K · **Dev 4** D→J.

## 5. Docs-engine pipeline (M4)

```mermaid
flowchart LR
    SRC[("project source")] --> SCAN["scan (parallel)<br/>LOC / stack / graph"]
    SCAN --> MATH["metrics<br/>McCabe (Python)"]
    SCAN --> SEC["secret / TODO scan"]
    MATH --> MODE{"mode"}
    SEC --> MODE
    MODE -->|"co-located"| CO["docs beside source<br/>#25"]
    MODE -->|"wiki"| WIKI["docs/wiki/*.md<br/>#18"]
    MODE -->|"readme"| RM["README.md update<br/>#19"]
    LLM["Gemini (bridge #16)"] -.-> CO
    LLM -.-> WIKI
    LLM -.-> RM
    KEY[["API key #15"]] -.-> LLM
    BASE["ported documentador #24"] --- SCAN
```

## 6. Release train & cross-project ordering

```mermaid
graph LR
    A["create-lumen<br/>v2.0.0-alpha (M1)"] --> B["create-lumen<br/>alpha.2 → rc"]
    A -. "unblocks lc#3, lc#5" .-> C["lumen-cli<br/>v1.0.0-alpha (M1)"]
    C --> D["lumen-cli<br/>alpha.2 → beta.2"]
    B --> E["create-lumen<br/>v2.0.0"]
    D --> F["lumen-cli<br/>v1.0.0"]
    E -. "contract stable" .-> F
```
