package com.landstack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class LandStackApplication {

    public static void main(String[] args) {
        SpringApplication.run(LandStackApplication.class, args);
    }
}
