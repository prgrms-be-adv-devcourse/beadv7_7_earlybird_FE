import { Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<div>프로젝트 목록 (Task 11에서 교체)</div>} />
      </Route>
    </Routes>
  );
}
