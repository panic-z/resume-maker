import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { ResumePage } from "./components/ResumePage";
import { messages, type Language } from "./lib/i18n";
import { loadLanguage, saveLanguage } from "./lib/storage";

function App() {
  const [language, setLanguage] = useState<Language>(() => loadLanguage());

  useEffect(() => {
    saveLanguage(language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = messages[language].app.title;
  }, [language]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="flex-1 overflow-hidden">
        <section className="sr-only">
          <h1>{messages[language].app.srTitle}</h1>
          <p>{messages[language].app.srDescription}</p>
        </section>
        <ResumePage language={language} />
      </main>
    </div>
  );
}

export default App;
