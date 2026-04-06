import { Header } from "./components/Header";
import { ResumePage } from "./components/ResumePage";

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ResumePage />
      </main>
    </div>
  );
}

export default App;
