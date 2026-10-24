import { verifyPassword } from './password.mjs';

const LOGIN_RE = /^[A-Za-z0-9_]{4,20}$/;
const PASS_RE = /^[A-Za-z0-9]{4,}$/;

/**
 * Parity with client/login.php credential checks + QualifAuth::loginUser.
 * @returns {Promise<{ ok: true, user: object } | { ok: false, message: string }>}
 */
export async function attemptLogin(db, { username, password }) {
  const login = String(username || '');
  const pass = String(password || '');

  if (!LOGIN_RE.test(login)) {
    return {
      ok: false,
      message:
        "Votre nom d'utilisateur doit comporter entre 4 et 20 caractères. L'utilisation de l'underscore est autorisée",
    };
  }
  if (!PASS_RE.test(pass)) {
    return {
      ok: false,
      message: 'Votre mot de passe doit comporter au moins 4 caractères',
    };
  }

  const row = await db.findUserByLogin(login);
  if (!row) {
    return {
      ok: false,
      message: `Le nom d'utilisateur ${login} n'existe pas`,
    };
  }
  if (Number(row.active_user) === 0) {
    return { ok: false, message: "Votre compte utilisateur n'a pas été activé" };
  }

  let valid = false;
  try {
    valid = verifyPassword(pass, row.pass_user);
  } catch {
    return { ok: false, message: 'Votre mot de passe est incorrect' };
  }
  if (!valid) {
    return { ok: false, message: 'Votre mot de passe est incorrect' };
  }

  return {
    ok: true,
    user: {
      id_user: Number(row.id_user),
      login_user: String(row.login_user),
      last_connexion: row.last_connexion || '1970-01-01 00:00:00',
      help: row.help,
    },
  };
}

export async function sessionStillValid(db, session) {
  if (!session) return false;
  const row = await db.findUserById(session.userId);
  return Boolean(row);
}
