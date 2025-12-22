import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { TestimonialsSection } from "../TestimonialsSection";
import { HowItWorksSection } from "../HowItWorksSection";
import { FundraisingCalculator } from "../FundraisingCalculator";
import { BrowserRouter } from "react-router-dom";

// Mock ResizeObserver which is used by Radix UI components (Slider)
class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

beforeAll(() => {
    global.ResizeObserver = MockResizeObserver;
});

afterAll(() => {
    // @ts-ignore
    delete global.ResizeObserver;
});

// Wrap components with BrowserRouter since they use Link
const renderWithRouter = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe("TestimonialsSection", () => {
    it("renders the success stories title", () => {
        renderWithRouter(<TestimonialsSection />);
        expect(screen.getByText("Success Stories")).toBeInTheDocument();
        expect(screen.getByText(/Trusted by/i)).toBeInTheDocument();
    });

    it("renders the testimonials cards", () => {
        renderWithRouter(<TestimonialsSection />);
        expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
        expect(screen.getByText("Principal Michael Ross")).toBeInTheDocument();
        expect(screen.getByText("Coach David Miller")).toBeInTheDocument();
    });

    it("renders the success ticker stats", () => {
        renderWithRouter(<TestimonialsSection />);
        // Check for the specific stats mentioned in the user request
        expect(screen.getByText("500+")).toBeInTheDocument();
        expect(screen.getByText("Schools Partnered")).toBeInTheDocument();

        expect(screen.getByText("$2.5M+")).toBeInTheDocument();
        expect(screen.getByText("Raised for Education")).toBeInTheDocument();

        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("Goal Satisfaction")).toBeInTheDocument();
    });
});

describe("HowItWorksSection", () => {
    it("renders the section title", () => {
        renderWithRouter(<HowItWorksSection />);
        // Actual text in the component
        expect(screen.getByText("The Process")).toBeInTheDocument();
        expect(screen.getByText(/Fundraising Has Never Been/i)).toBeInTheDocument();
    });

    it("renders all three steps in the navigation", () => {
        renderWithRouter(<HowItWorksSection />);
        expect(screen.getByText("1. We Build Your Store")).toBeInTheDocument();
        expect(screen.getByText("2. Students Share Links")).toBeInTheDocument();
        expect(screen.getByText("3. Watch Revenue Grow")).toBeInTheDocument();
    });

    it("updates the visual display when a step is clicked", () => {
        renderWithRouter(<HowItWorksSection />);

        // Initially, step 1 details should be visible (default)
        expect(screen.getByText(/Forget complex forms/i)).toBeInTheDocument();

        // Click on step 2
        fireEvent.click(screen.getByText("2. Students Share Links"));

        // Step 2 details should now be visible (check an element unique to step 2's active state)
        expect(screen.getByText(/No door-to-door sales/i)).toBeInTheDocument();

        // Click on step 3
        fireEvent.click(screen.getByText("3. Watch Revenue Grow"));

        // Step 3 details should now be visible
        expect(screen.getByText(/Track sales, student participation/i)).toBeInTheDocument();
    });
});

describe("FundraisingCalculator", () => {
    it("renders the calculator with default values", () => {
        renderWithRouter(<FundraisingCalculator />);
        // The actual title in the component
        expect(screen.getByText(/See How Much/i)).toBeInTheDocument();
        expect(screen.getByText("Number of Participants")).toBeInTheDocument();
    });

    it("displays the comparison bar chart with fundraiser types", () => {
        renderWithRouter(<FundraisingCalculator />);
        expect(screen.getByText("Aurora Products")).toBeInTheDocument();
        expect(screen.getByText("Cookie Dough")).toBeInTheDocument();
        expect(screen.getByText("Candy Bars")).toBeInTheDocument();
    });
});
