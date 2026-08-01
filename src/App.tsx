import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "./app/providers/QueryProvider";
import { AppRoutes } from "./app/router";

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
