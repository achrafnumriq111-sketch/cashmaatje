// Centrale rol-labels en helpers voor entity-toegang
export type EntityRole = "owner" | "admin" | "editor" | "viewer";

export const ROLE_LABELS_NL: Record<EntityRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  editor: "Editor",
  viewer: "Lezer",
};

export const ROLE_DESCRIPTIONS_NL: Record<EntityRole, string> = {
  owner: "Volledige toegang, kan eigenaar overdragen of organisatie verwijderen",
  admin: "Volledige toegang, kan andere gebruikers en rollen beheren",
  editor: "Lezen en bewerken van alle gegevens",
  viewer: "Alleen-lezen toegang",
};

export function defaultPermissionsForRole(role: EntityRole) {
  switch (role) {
    case "owner":
    case "admin":
      return { can_read: true, can_write: true, can_admin: true };
    case "editor":
      return { can_read: true, can_write: true, can_admin: false };
    case "viewer":
      return { can_read: true, can_write: false, can_admin: false };
  }
}
