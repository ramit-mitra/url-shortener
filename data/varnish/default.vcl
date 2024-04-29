vcl 4.1;

import std;
import vsthrottle;

backend default {
    .host = "app__url_shortener";
    .port = "1234";
}

# acl purge {
#     "localhost";
#     "127.0.0.1";
#     "::1";
# }

sub vcl_recv {
    # Rate limit requests
    # Allow max 10 requests per 15 seconds
    # If it exceeds, block for 123 seconds

    # Am using Cloudflare so the client IP is populated to the header Cf-Connecting-Ip
    # If you're not using Cloudflare remember to update the header to as required

    if (vsthrottle.is_denied(
        "incr" + req.http.Cf-Connecting-Ip, 10, 15s, 123s
    )) {
        return (synth(429, "Too Many Requests, slow down"));
    }

    return(pass);
}

sub vcl_deliver {
    # this probably doesn't work
    unset resp.http.Via;
    unset resp.http.X-Varnish;
}