import { describe, expect, it, vi } from "vitest";
import { createCleanupCoordinator } from "./cleanup-state";

function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const notify = vi.fn();
  return { storage, values, coordinator: createCleanupCoordinator(storage, notify) };
}
describe("acknowledged data cleanup", () => {
  it("persists the guard before deletion starts and completes only after acknowledgment", async () => {
    const { coordinator, values } = fixture();
    let acknowledge!: () => void;
    const deletion = new Promise<void>((resolve) => {
      acknowledge = resolve;
    });
    const running = coordinator.run("user-a", () => deletion);
    expect(values.has("expense-tracker:cleanup:user-a")).toBe(true);
    expect(coordinator.get("user-a")).toEqual({ running: true, error: "" });
    await Promise.resolve();
    expect(coordinator.get("user-a")?.running).toBe(true);
    acknowledge();
    await running;
    expect(coordinator.get("user-a")).toBeNull();
    expect(values.size).toBe(0);
  });
  it("joins duplicate attempts in the same tab while one deletion is running", async () => {
    const { coordinator } = fixture();
    let acknowledge!: () => void;
    const deleteData = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          acknowledge = resolve;
        }),
    );
    const first = coordinator.run("user-a", deleteData);
    const second = coordinator.run("user-a", deleteData);
    expect(second).toBe(first);
    await Promise.resolve();
    expect(deleteData).toHaveBeenCalledTimes(1);
    acknowledge();
    await first;
  });
  it("keeps uncertain failures pending after reload without automatically deleting again", async () => {
    const { coordinator, storage, values } = fixture();
    await expect(
      coordinator.run("user-a", async () => {
        throw new Error("Connection lost");
      }),
    ).rejects.toThrow("Connection lost");
    expect(coordinator.get("user-a")).toMatchObject({
      running: false,
      error: expect.stringContaining("Connection lost"),
    });
    const reloaded = createCleanupCoordinator(storage, vi.fn());
    expect(reloaded.get("user-a")).toMatchObject({
      running: false,
      error: expect.stringContaining("Retry cleanup"),
    });
    expect(reloaded.get("user-b")).toBeNull();
    expect(values.size).toBe(1);
    const retry = vi.fn(async () => undefined);
    await reloaded.run("user-a", retry);
    expect(retry).toHaveBeenCalledOnce();
    expect(reloaded.get("user-a")).toBeNull();
  });
});
