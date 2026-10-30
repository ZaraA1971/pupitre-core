/**
 * Parity with webservice/auth.php:
 * - GET login + password + section
 * - password compared in clear text (legacy contract)
 * - section selects DB dash_{section}
 * - on success, loads themes from admin_dash.users.themes + admin_dash.theme
 */
export async function authenticate(db, query) {
  const login = String(query.login ?? '');
  const password = String(query.password ?? '');
  const section = String(query.section ?? '').toLowerCase();

  if (!login || !section) {
    return { success: 0 };
  }

  const sectionDb = `dash_${section}`;
  const user = await db.findUserByLogin(sectionDb, login);
  if (!user || Number(user.active_user) !== 1 || String(password) !== String(user.pass_user)) {
    return { success: 0 };
  }

  const id_user = Number(user.id_user);
  const name_user = String(user.login_user);
  const themesList = await db.getUserThemeIds('admin_dash', id_user);
  const themes = themesList.length
    ? await db.getThemesByIds('admin_dash', themesList)
    : [];

  return {
    success: 1,
    id_user,
    name_user,
    themes,
    sectionDb,
  };
}
