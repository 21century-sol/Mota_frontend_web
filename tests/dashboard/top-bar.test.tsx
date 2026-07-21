import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TopBar } from "@/components/dashboard/TopBar";

describe("TopBar", () => {
  it("renders the user-confirmed static account label without changing the account pill", () => {
    render(<TopBar />);

    const accountLabel = screen.getByText("Sinhan");
    const accountPill = accountLabel.parentElement;

    expect(accountLabel).toBeInTheDocument();
    expect(screen.queryByText("어드민어드민어드민")).not.toBeInTheDocument();
    expect(accountPill).toHaveClass(
      "w-[110px]",
      "gap-1",
      "rounded-full",
      "p-1",
    );
  });
});
