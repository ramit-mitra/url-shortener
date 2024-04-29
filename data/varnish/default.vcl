vcl 4.1;

import std;
import vsthrottle;

backend default {
    .host = "app__url_shortener";
    .port = "1234";
}

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
    unset resp.http.via;
    unset resp.http.x-url;
    unset resp.http.x-host;
    unset resp.http.server;
    unset resp.http.x-powered-by;
}