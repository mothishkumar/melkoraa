import { createAsyncGuard } from "@/src/hooks/use-async-guard";

describe("createAsyncGuard", () => {
  it("prevents overlapping async work", async () => {
    const guard = createAsyncGuard();
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return "done";
    };

    const first = guard.run(task);
    const second = guard.run(task);
    await Promise.all([first, second]);

    expect(maxActive).toBe(1);
    expect(await first).toBe("done");
    expect(await second).toBeUndefined();
  });
});
