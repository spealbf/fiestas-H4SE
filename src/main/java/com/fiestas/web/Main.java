
package com.fiestas.web;

import io.helidon.logging.common.LogConfig;
import io.helidon.config.Config;
import io.helidon.webserver.WebServer;
import io.helidon.webserver.http.HttpRouting;

/**
 * The application main class.
 */
public class Main {
    /**
     * Cannot be instantiated.
     */
    private Main() {
    }
    public static void main(String[] args) {
        Routing routing = Routing.builder()
            // Frontend
            .register("/", StaticContentSupport.create("public"))
            // API
            .get("/api/hello", (req, res) -> {
                res.send("Hola desde Helidon");
            })
            .build();
        WebServer.create(
                ServerConfiguration.builder()
                        .port(8080)
                        .build(),
                routing
        ).start();
    }
}