/** @jest-environment node */

import type { ZodIssue } from "zod";
import {
  API_MSG_UNAUTHORIZED,
  jsonBadRequest,
  jsonConflict,
  jsonForbidden,
  jsonGone,
  jsonNotFound,
  jsonUnauthorized,
  jsonValidationFailed,
} from "@/lib/api-json";

describe("api-json", () => {
  it("jsonUnauthorized — קוד ומבנה אחיד", async () => {
    const res = jsonUnauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe(API_MSG_UNAUTHORIZED);
    expect(body.code).toBe("unauthorized");
  });

  it("jsonForbidden", async () => {
    const res = jsonForbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("forbidden");
  });

  it("jsonBadRequest", async () => {
    const res = jsonBadRequest("חסר שדה");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("חסר שדה");
    expect(body.code).toBe("bad_request");
  });

  it("jsonNotFound / jsonGone / jsonConflict", async () => {
    expect((await jsonNotFound("x")).status).toBe(404);
    expect((await jsonGone("y")).status).toBe(410);
    expect((await jsonConflict("z")).status).toBe(409);
  });

  it("jsonValidationFailed — כולל issues", async () => {
    const issues = [{ code: "custom", path: ["x"], message: "bad" }] as unknown as ZodIssue[];
    const res = jsonValidationFailed(issues);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_failed");
    expect(body.issues).toHaveLength(1);
  });
});
