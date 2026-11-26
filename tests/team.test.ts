import { describe, expect, it } from "vitest";
import { inviteMemberSchema, memberRoleSchema, removeMemberSchema } from "@/lib/validation";
import { assignableRoles, canEditMember, canManageTeam } from "@/lib/roles";

const ID = "3f1c2b8e-6a4d-4c2e-9b7a-1d2e3f4a5b6c";

describe("inviteMemberSchema", () => {
  it("nettoie l'e-mail et accepte un rôle connu", () => {
    expect(inviteMemberSchema.parse({ email: "  Tatoo@Studio.FR ", role: "artist" })).toEqual({
      email: "tatoo@studio.fr",
      role: "artist",
    });
  });
  it("refuse e-mail vide ou invalide et rôle inconnu", () => {
    expect(inviteMemberSchema.safeParse({ email: "", role: "artist" }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ email: "pas-un-mail", role: "artist" }).success).toBe(
      false,
    );
    expect(inviteMemberSchema.safeParse({ email: "a@b.fr", role: "superadmin" }).success).toBe(
      false,
    );
    expect(inviteMemberSchema.safeParse({ email: "a@b.fr", role: "" }).success).toBe(false);
  });
});

describe("memberRoleSchema / removeMemberSchema", () => {
  it("exige un identifiant de membre valide", () => {
    expect(memberRoleSchema.safeParse({ userId: ID, role: "admin" }).success).toBe(true);
    expect(memberRoleSchema.safeParse({ userId: "x", role: "admin" }).success).toBe(false);
    expect(removeMemberSchema.safeParse({ userId: ID }).success).toBe(true);
    expect(removeMemberSchema.safeParse({ userId: "" }).success).toBe(false);
  });
});

describe("droits d'équipe (affichage)", () => {
  it("seuls owner et admin gèrent l'équipe", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("artist")).toBe(false);
    expect(canManageTeam("assistant")).toBe(false);
  });
  it("seul un owner peut nommer un owner", () => {
    expect(assignableRoles("owner")).toContain("owner");
    expect(assignableRoles("admin")).not.toContain("owner");
    expect(assignableRoles("artist")).toEqual([]);
  });
  it("un admin ne modifie pas un owner", () => {
    expect(canEditMember("admin", "owner")).toBe(false);
    expect(canEditMember("admin", "artist")).toBe(true);
    expect(canEditMember("owner", "owner")).toBe(true);
    expect(canEditMember("artist", "assistant")).toBe(false);
  });
});
