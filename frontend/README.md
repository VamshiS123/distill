# Distill - LLM Input Compression Dashboard

A high-performance, modern dashboard for visualizing and analyzing Distill, an information-theoretic LLM input compression model that removes low-entropy tokens to optimize inference performance.

## 🚀 Features

- **Interactive Comparison Table** - Compare Distill with other compression methods
- **Accuracy Visualization** - Track accuracy metrics across different compression ratios
- **Compression Charts** - Visualize compression performance with interactive charts
- **Latency Analysis** - Monitor latency improvements from compression
- **Cost Analysis** - Track cost savings from reduced token usage
- **Context Understanding** - Explore how compression affects context preservation
- **Methodology Details** - Deep dive into the compression approach
- **Limitations Documentation** - Transparent discussion of current limitations

## 🛠️ Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library
- **Lucide React** - Beautiful icon library

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/VamshiS123/distill.git
cd distill/ui
```

2. Install dependencies:
```bash
npm install
```

## 🎯 Usage

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Build CSS

Build the Tailwind CSS output:
```bash
npm run build:css
```

Watch for CSS changes:
```bash
npm run watch:css
```

### Production Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📁 Project Structure

```
ui/
├── components/          # React components
│   ├── HeroSection.tsx
│   ├── ComparisonTable.tsx
│   ├── AccuracyPanel.tsx
│   ├── CompressionChart.tsx
│   ├── LatencyPanel.tsx
│   ├── CostPanel.tsx
│   ├── ContextSection.tsx
│   ├── MethodologySection.tsx
│   ├── ApproachSection.tsx
│   └── LimitationsSection.tsx
├── src/
│   └── input.css        # Tailwind CSS input file
├── dist/                # Build output
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── index.html           # HTML template
├── constants.ts         # Application constants
├── types.ts             # TypeScript type definitions
├── metadata.json        # Application metadata
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🎨 Features Overview

### Hero Section
Introduces Distill with compelling visuals and key value propositions.

### Comparison Table
Side-by-side comparison of Distill with other compression methods, highlighting advantages.

### Accuracy Panel
Visual representation of accuracy metrics at different compression levels.

### Compression Chart
Interactive charts showing compression ratios and performance metrics.

### Latency Panel
Analysis of latency improvements achieved through compression.

### Cost Panel
Cost savings visualization from reduced token usage.

### Context Section
Exploration of how compression maintains context quality.

### Methodology Section
Detailed explanation of the compression approach and techniques.

### Approach Section
Technical deep dive into the implementation strategy.

### Limitations Section
Honest discussion of current limitations and areas for improvement.

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run build:css` - Build Tailwind CSS
- `npm run watch:css` - Watch Tailwind CSS for changes

## 🌟 Key Highlights

- **Modern UI/UX** - Clean, responsive design with smooth animations
- **Performance Optimized** - Built with Vite for fast development and production builds
- **Type Safe** - Full TypeScript support for better developer experience
- **Accessible** - Built with accessibility best practices
- **Responsive** - Works seamlessly on desktop, tablet, and mobile devices

## 📝 License

This project is part of The Token Company Challenge - Distill Project.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ for optimizing LLM inference performance.
