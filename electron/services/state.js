let currentActivatedEnv = null;

function getActivatedEnv() {
  return currentActivatedEnv;
}

function setActivatedEnv(name) {
  currentActivatedEnv = name;
}

module.exports = { getActivatedEnv, setActivatedEnv };
