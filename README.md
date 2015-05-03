# proxify
Generate nginx &amp; dnsmasq configuration, plus dnsimple shell scripts for your reverse proxy

```
Usage: proxify (<hostname> | <file>) [:listen] [:target] [--options]...

Options:
  -d, --DOMAIN    Domain name sub-domains built on            [default: "local"]
  -i, --SERVER    Private IP address of the host server   [default: "127.0.0.1"]
  -o, --ROUTER    Domain pointing to home router       [default: "router.local"]
  -c, --CA        Certificate Authority URL  [default: "http://127.0.0.1:11443"]
  -n, --DNSIMPLE  email:key
  -s, --ssl       Create SSL host & certificate                        [boolean]
  -a, --auth      Authenticate with client certificate (ssl implied)   [boolean]
  -p, --password  Authenticate with username/password (ssl implied)    [boolean]
  -r, --redirect  Redirect to target                                   [boolean]
  -h, --help      Show help
```

## Installation  

`npm install -g suderman/proxify`  
