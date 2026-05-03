# 🤖 ML Code Explainer

![ML Code Explainer Demo](https://raw.githubusercontent.com/fakhrihakim20/ML-RL-Code-Explainer/main/.design/ml-code-explainer/screenshots/variant-a.png)

A beautiful, beginner-friendly web application that takes complex Machine Learning (ML) and Reinforcement Learning (RL) Python code and breaks it down into easy-to-understand explanations and color-coded visual diagrams. 

👉 **[Live Demo](https://fakhrihakim20.github.io/ML-RL-Code-Explainer/)**

---

## ✨ Features

*   **Scandinavian Design:** A clean, editorial interface that prioritizes readability and warmth. Features a soft typography scale, light/dark mode support, and non-intimidating aesthetics.
*   **Color-Coded Explanations:** Explanations are automatically segmented and highlighted with an elegant, rotating 6-color palette to help your eyes track different concepts seamlessly.
*   **Dynamic Visualizations:** Automatically generates architecture flowcharts and concept maps using `Mermaid.js` directly in the browser. Diagrams are color-coded (Inputs = Blue, Processing = Amber, Data = Rose, etc.) for ultimate clarity.
*   **Multiple AI Providers:** Choose your favorite AI backend:
    *   **OpenRouter** (Recommended - Access hundreds of models like LLaMA, Gemma, GPT)
    *   **Google Gemini**
    *   **Hugging Face**
*   **API Usage Tracking:** Built-in dashboard to monitor your OpenRouter credit limits, tier status, and generation usage.

## 🚀 How to Use

1.  Visit the [Live App](https://fakhrihakim20.github.io/ML-RL-Code-Explainer/).
2.  Click **API Setup** in the top right corner.
3.  Select your preferred provider (e.g., OpenRouter) and paste your free API key. *(Keys are stored locally in your browser and never sent to a server).*
4.  Paste any Python code into the left editor.
5.  Click **Explain** to get a plain-English, section-by-section breakdown.
6.  Click **Visualize** to generate interactive flowcharts and concept maps.

## 🛠️ Tech Stack

*   **HTML5 / CSS3 / Vanilla JavaScript:** No heavy frameworks, no build steps. 100% static and fast.
*   **Design Tokens:** Managed via custom `tokens.css` for semantic styling.
*   **Mermaid.js:** Used for rendering real-time SVG diagrams.

## 💻 Local Development

Because this is a completely static, vanilla project, there is no build process required. 

However, because the app fetches external data (Mermaid.js CDN and AI APIs), you must serve it over a local HTTP server to avoid CORS/File-protocol restrictions.

1. Clone the repository:
```bash
git clone https://github.com/fakhrihakim20/ML-RL-Code-Explainer.git
cd ML-RL-Code-Explainer
```

2. Start a simple Python server:
```bash
python -m http.server 8080
```

3. Open your browser and navigate to `http://localhost:8080`.

## 📜 License

This project is licensed under the [MIT License](LICENSE).