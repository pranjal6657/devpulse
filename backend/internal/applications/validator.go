package applications

import (
	"fmt"
	"net"
	"net/url"
	"strings"
)

func ValidateEndpoint(endpoint string) error {
	u, err := url.ParseRequestURI(endpoint)
	if err != nil {
		return fmt.Errorf("invalid endpoint")
	}

	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("endpoint must use HTTP or HTTPS")
	}

	if u.Hostname() == "" {
		return fmt.Errorf("endpoint hostname is required")
	}

	host := strings.ToLower(u.Hostname())

	// Block obvious local/internal hostnames.
	blockedHosts := map[string]bool{
		"localhost":             true,
		"localhost.localdomain": true,
	}

	if blockedHosts[host] {
		return fmt.Errorf("internal endpoints are not allowed")
	}

	ip := net.ParseIP(host)

	if ip != nil && isPrivateIP(ip) {
		return fmt.Errorf("private or internal IP addresses are not allowed")
	}

	return nil
}

func isPrivateIP(ip net.IP) bool {
	if ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() {
		return true
	}

	// IPv4 broadcast / unspecified addresses.
	if ip.Equal(net.IPv4bcast) || ip.IsUnspecified() {
		return true
	}

	return false
}
