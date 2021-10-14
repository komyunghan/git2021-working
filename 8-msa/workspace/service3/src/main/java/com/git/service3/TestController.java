package com.git.service3;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

	@GetMapping(value = "/test")
	public String test() {
		System.out.println("--service 3--");
		return "3";
	}
}
