package dev.anhhoang.QTCSDLHD.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestRedisController {
   @Autowired
   private RedisTemplate<String, Object> redisTemplate;

    @GetMapping("/test-redis")
    public String testRedis() {
        System.out.println("hello=========================");
        redisTemplate.opsForValue().set("foo", "bar");
        return (String) redisTemplate.opsForValue().get("foo");
    }
}
