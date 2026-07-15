import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "../../components/dashboard/SearchInput";

describe("SearchInput", () => {
  it("renders the placeholder and no clear button by default", () => {
    render(<SearchInput />);

    expect(
      screen.getByPlaceholderText("차량번호, 고객명, 예약번호 검색"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "검색어 지우기" }),
    ).not.toBeInTheDocument();
  });

  it("reflects typed input and shows the clear button", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByPlaceholderText(
      "차량번호, 고객명, 예약번호 검색",
    );
    await user.type(input, "12가 3456");

    expect(input).toHaveValue("12가 3456");
    expect(
      screen.getByRole("button", { name: "검색어 지우기" }),
    ).toBeInTheDocument();
  });

  it("clears the input and hides the clear button when clicked", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByPlaceholderText(
      "차량번호, 고객명, 예약번호 검색",
    );
    await user.type(input, "홍길동");
    await user.click(screen.getByRole("button", { name: "검색어 지우기" }));

    expect(input).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "검색어 지우기" }),
    ).not.toBeInTheDocument();
  });

  // No fetch/axios mock is set up here on purpose: SearchInput only holds local
  // typing state (Figma nodes 2467:28491 / 2715:27388) and never issues a network
  // request (search execution is a non-goal for issue #10, confirmed by code review
  // of components/dashboard/SearchInput.tsx — no fetch/axios import exists).
});
