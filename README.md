# proxify
Generate nginx &amp; dnsmasq configuration, plus htpasswd, ssl certificates, &amp; dnsimple shell scripts for your reverse proxy

```
Usage: proxify (<hostname> | <file>) [:listen] [:target] [--options]...

Options:
  -d, --DOMAIN    Domain name sub-domains built on            [default: "local"]
  -i, --SERVER    Private IP address of the host server   [default: "127.0.0.1"]
  -t, --ROUTER    Domain pointing to home router       [default: "router.local"]
  -o, --OUTPUT    Output directory, used in configuration      [default: "/etc"]
  -u, --USER      User account running process             [default: "www-data"]
  -c, --CA        Certificate Authority URL  [default: "http://127.0.0.1:11443"]
  -l, --LOGIN     name:password                   [default: "www-data:www-data"]
  -n, --DNSIMPLE  email:key
  -s, --ssl       Create SSL host & certificate                        [boolean]
  -a, --auth      Authenticate with client certificate (ssl implied)   [boolean]
  -p, --pass      Authenticate with HTTP password, create htpasswd     [boolean]
  -r, --redirect  Redirect to target                                   [boolean]
  -f, --force     Force overwriting files                              [boolean]
  -h, --help      Show help
```

## Installation  

`npm install -g suderman/proxify`  
