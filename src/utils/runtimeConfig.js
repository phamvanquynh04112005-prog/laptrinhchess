const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const isLanIp = (hostname) => /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

const getLocalBackendOrigin = () => {
  const { hostname, protocol } = window.location;
  return `${protocol}//${hostname}:5000`;
};

export const getApiBaseUrl = () => {
  const configuredApiUrl = process.env.REACT_APP_API_URL?.trim();

  if (configuredApiUrl) {
    return trimTrailingSlash(configuredApiUrl);
  }

  if (
    LOCAL_HOSTS.has(window.location.hostname) ||
    isLanIp(window.location.hostname)
  ) {
    return `${getLocalBackendOrigin()}/api`;
  }

  return `${window.location.origin}/api`;
};

export const getSocketBaseUrl = () => {
  const configuredSocketUrl = process.env.REACT_APP_SOCKET_URL?.trim();

  if (configuredSocketUrl) {
    return trimTrailingSlash(configuredSocketUrl);
  }

  if (
    LOCAL_HOSTS.has(window.location.hostname) ||
    isLanIp(window.location.hostname)
  ) {
    return getLocalBackendOrigin();
  }

  return window.location.origin;
};
