package com.git.controller.contact;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicLong;

import javax.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// REST API
// REST 방식으로 접근할 수 있는 인터페이스 제공하는 프로그램

//@Controller
//@ResponseBody
@RestController
public class ContactController {
	// HashMap 정렬이 안 됨: get(key) -> O(1)
	// ConcurrentSkipListMap 키 기준으로 정렬이 되었있음: get(key) -> O(logn)
	private SortedMap<Long, Contact> contacts = 
			Collections.synchronizedSortedMap(new TreeMap<Long, Contact>(Collections.reverseOrder())) ;
	// id값 생성에 사용할 변수
	private AtomicLong maxId = new AtomicLong();

	// contact 목록조회
	// GET /contacts
	@GetMapping(value = "/contacts")
	public List<Contact> getContacts() {
		// 맵 값목록
		return new ArrayList<Contact>(contacts.values());
	}

	// contact 1건 추가
	// POST /contacts {"memo":"테스트입니다"}
	@PostMapping(value = "/contacts")
	public Contact addContact(@RequestBody Contact contact, HttpServletResponse res) {
		// 데이터 검증 로직
		// 메모값이 없으면 에러처리함
		if(contact.getName()  == null || contact.getName().isEmpty() 
				&& contact.getPhone()  == null || contact.getPhone().isEmpty() 
				&& contact.getEmail()  == null || contact.getEmail().isEmpty()) {
			// 클라이언트에서 메모값이 없이 보내거나 빈값으로 보낸 것임
			// 클라이언트 오류, 4xx
			// 요청값을 잘못보낸 것임 - Bad Request (400)
			// res.setStatus(400);
			
			// Dispatcher Servlet이 생성한 응답객체에 status코드를 넣어줌
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			return null;
		}
		
		// id값을 생성
		Long currentId = maxId.incrementAndGet();
		
		// 입력받은 데이터로 contact객체를 생성
		// id값과 생성일시는 서버에서 생성한 것으로 처리함
		// html태그가 있으면 날려버림(script에서 문제가 발생함)
		Contact contactItem = Contact.builder()
								.id(currentId)
//								.name(contact.getName().replaceAll("<(/)?([a-zA-Z]*)(\\s[a-zA-Z]*=[^>]*)?(\\s)*(/)?>", ""))
								.name(contact.getName())
								.phone(contact.getPhone())
								.email(contact.getEmail())
								.createdTime(new Date().getTime())
							.build();
		// contact 목록객체 추가
		contacts.put(currentId, contactItem);
		
		// 리소스 생성됨
		// res.setStatus(201);
		res.setStatus(HttpServletResponse.SC_CREATED);
		
		// 추가된 객체를 반환
		return contactItem;
	}
	
	// contact 1건 삭제
	// DELETE /contacts/1 -> id가 1인 항목을 삭제해라
	// id값이 path variable로
	@DeleteMapping(value="/contacts/{id}")
	public boolean removeContact(@PathVariable long id, HttpServletResponse res) {
		
		// 해당 id의 데이터 1건을 가져옴
		Contact contact = contacts.get(Long.valueOf(id));
		// 해당 id의 데이터가 없으면
		if(contact == null) {
			// res.setStatus(404);
			// NOT FOUND: 해당 경로에 리소스가 없음
			res.setStatus(HttpServletResponse.SC_NOT_FOUND);
			return false;
		}
		
		// 삭제 수행
		contacts.remove(Long.valueOf(id));
		
		return true;
	}
	
	// contact 1건 수정
	// PUT /contacts/1 {"memo":"..."}
	// id값이 path variable로 
	@PutMapping(value="/contacts/{id}")	
	public Contact modifyContact(@PathVariable long id, @RequestBody Contact contact, HttpServletResponse res) {
		// 해당 id의 데이터 1건을 가져옴
		Contact findItem = contacts.get(Long.valueOf(id));
		// 해당 id의 데이터가 없으면
		if(findItem == null) {
			// res.setStatus(404);
			// NOT FOUND: 해당 경로에 리소스가 없음
			res.setStatus(HttpServletResponse.SC_NOT_FOUND);
			return null;
		}
		
		// 데이터 검증 로직
		// 메모값이 없으면 에러처리함
		if(contact.getName()  == null || contact.getName().isEmpty() 
				&& contact.getPhone()  == null || contact.getPhone().isEmpty() 
				&& contact.getEmail()  == null || contact.getEmail().isEmpty()) {
			// 클라이언트에서 메모값이 없이 보내거나 빈값으로 보낸 것임
			// 클라이언트 오류, 4xx
			// 요청값을 잘못보낸 것임 - Bad Request (400)
			// res.setStatus(400);
			
			// Dispatcher Servlet이 생성한 응답객체에 status코드를 넣어줌
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			return null;
		}		
		
		// 데이터 변경
		findItem.setName(contact.getName());
		findItem.setPhone(contact.getPhone());
		findItem.setEmail(contact.getEmail());
		return findItem;
	}
	
} 