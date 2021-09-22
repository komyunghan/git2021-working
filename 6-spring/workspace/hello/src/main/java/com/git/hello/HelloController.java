package com.git.hello;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

// Controller: HTTP ��û�� ���� ������ ó���� �� �ִ� Ŭ����
// RestController: Controller�ε� �������� ������ ��ü�� ó����
//@Controller
//@ResponseBody
@RestController
public class HelloController {

	@RequestMapping(value="/hello", method=RequestMethod.GET)
	public String hello() {
		return "Hello, Spring Boot!";
		}
}