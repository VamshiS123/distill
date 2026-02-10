# Frontend Dashboard

The Distill frontend is a React-based application designed to visualize the impact of compression on performance and cost.

## Core Features

### 1. Accuracy Panel
Visualizes the "Accuracy Delta" when using compressed prompts. It shows that Distill maintains high fidelity (within ~1% of baseline) even at high compression rates.

### 2. Comparison Table
A head-to-head comparison between Distill and other compression methods (like `bear-1`).
*   **Metrics**: Token Reduction, Accuracy Change, P(better), and Latency.
*   **Winner Badging**: Highlights which model performs best on specific metrics.

### 3. Compression Chart
A scatter plot showing the relationship between "Context Length" and "Information Retention." It helps users identify the "Sweet Spot" for their specific use case.

### 4. Cost & Latency Panels
Real-time calculators showing:
*   **Direct Cost Savings**: Estimated reduction in OpenAI/Anthropic bills.
*   **Latency Breakdown**: Shows the tradeoff between compression time (local BERT pass) and saved LLM generation time.

## Technology Stack
*   **Framework**: React (TypeScript)
*   **Styling**: Tailwind CSS
*   **Charts**: Recharts
*   **Icons**: Lucide React
*   **Bundler**: Vite
