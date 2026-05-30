import { CocosIframe } from "./components/cocos/CocosIframe";
import { EventBridgeProvider } from "./contexts/EventBridgeProvider";
import { InteractiveButtonsLayout } from "./components/pet-actions/InteractiveButtonsLayout";
import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <EventBridgeProvider>
        <InteractiveButtonsLayout>
          <CocosIframe />
        </InteractiveButtonsLayout>
      </EventBridgeProvider>
    </main>
  );
}

export default App;
