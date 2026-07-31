import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

describe("shared/ui", () => {
  it("Button은 variant에 따라 배경 클래스를 바꾼다", () => {
    render(<Button variant="secondary">눌러줘</Button>);
    expect(screen.getByRole("button", { name: "눌러줘" }).className).toContain("bg-peach");
  });

  it("Card는 children을 감싼다", () => {
    render(<Card>카드 내용</Card>);
    expect(screen.getByText("카드 내용")).toBeInTheDocument();
  });

  it("Badge는 tone 클래스를 적용한다", () => {
    render(<Badge tone="lavender">NEW</Badge>);
    expect(screen.getByText("NEW").className).toContain("bg-lavender/40");
  });

  it("Spinner는 상태 role과 라벨을 보여준다", () => {
    render(<Spinner label="잠시만요" />);
    expect(screen.getByRole("status")).toHaveTextContent("잠시만요");
  });

  it("EmptyState는 메시지를 보여준다", () => {
    render(<EmptyState message="아직 없어요" />);
    expect(screen.getByText("아직 없어요")).toBeInTheDocument();
  });

  it("ErrorState는 error.message를 보여준다", () => {
    render(<ErrorState error={{ message: "문제가 생겼어요", errors: null }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("문제가 생겼어요");
  });

  it("ErrorState는 error가 null이면 기본 메시지를 보여준다", () => {
    render(<ErrorState error={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("알 수 없는 오류가 발생했습니다.");
  });
});
