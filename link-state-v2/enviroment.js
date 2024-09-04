let USER = null;

const setUser = (user) => {
  USER = user;
}

const getUser = () => {
  return USER;
}

module.exports = {
  setUser,
  getUser,
}