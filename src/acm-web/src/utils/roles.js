const normalizeRole = (value) => {
  const role = String(value ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');
  const aliases = {
    '0': 'admin',
    departmenthead: 'admin',
    depthead: 'admin',
    admin: 'admin',
    '1': 'professor',
    lecturer: 'professor',
    professor: 'professor',
    '2': 'ta',
    teacher: 'ta',
    teachingassistant: 'ta',
    ta: 'ta',
    '3': 'student',
    student: 'student',
  };

  return aliases[role] ?? role;
};

export const getUserRole = (user) => normalizeRole(user?.role ?? user?.Role);

export const hasRole = (user, allowedRoles) => {
  const role = getUserRole(user);
  return allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === role);
};