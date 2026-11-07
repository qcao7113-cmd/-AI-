package com.shiliao;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 药膳智养 · 慢性病食疗管理平台 —— 后端启动类
 */
@SpringBootApplication
@MapperScan("com.shiliao.repository")
public class ShiliaoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShiliaoApplication.class, args);
    }
}
