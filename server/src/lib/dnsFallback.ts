import dns from "node:dns";

const PUBLIC_RESOLVERS = ["1.1.1.1", "8.8.8.8"];

function isLoopback(addr: string): boolean {
  return addr === "" || addr === "127.0.0.1" || addr === "::1" || addr === "[::1]";
}

export function ensureUsableDnsServers(): boolean {
  const servers = dns.getServers();
  if (servers.length > 0 && !servers.every(isLoopback)) return false;

  const merged = [
    ...servers.filter((s) => !isLoopback(s)),
    ...PUBLIC_RESOLVERS,
  ];
  dns.setServers(merged);
  return true;
}
