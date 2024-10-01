// // Hàm để đặt cookie
// function setCookie(name, value) {
//     document.cookie = name + "=" + (value || "") + "; path=/";
//   }

//   // Xử lý sự kiện nhấn nút
// document.getElementById('test').addEventListener('click', function() {
//     // Thông tin cần gửi
//     const data = {
//       username: 'test1',
//       password: 'test1'
//     };

//     // Thực hiện yêu cầu fetch tới API
//     fetch('http://157.66.81.26:8000/api/account/login/', {
//       method: 'POST', // Phương thức HTTP
//       headers: {
//         'Content-Type': 'application/json' // Định dạng dữ liệu gửi đi
//       },
//       body: JSON.stringify(data) // Chuyển đổi dữ liệu thành JSON
//     })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
//       return response.json(); // Chuyển đổi dữ liệu phản hồi thành JSON
//     })
//     .then(data => {
//       console.log('Success:', data); // Xử lý dữ liệu phản hồi từ server

//       // Lưu các giá trị vào cookie
//       if (data.refresh) {
//         setCookie('refresh', data.refresh); // Lưu cookie với giá trị refresh
//       }
//       if (data.access) {
//         setCookie('access', data.access); // Lưu cookie với giá trị access
//       }
//     })
//     .catch(error => {
//       console.error('Error:', error); // Xử lý lỗi nếu có
//     });
// });

document.addEventListener('DOMContentLoaded', function () {
  // Đăng ký sự kiện cho các form
  var loginForm = document.getElementById('login_form');
  var newUserForm = document.getElementById('new_user');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginFormSubmit);
  }

  if (newUserForm) {
    newUserForm.addEventListener('submit', handleNewUserFormSubmit);
  }
});

function handleLoginFormSubmit(event) {
  event.preventDefault(); // Ngăn chặn việc gửi form thông thường

  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;

  // Kiểm tra tính hợp lệ của dữ liệu
  if (username.trim() === '') {
    alert('Vui lòng nhập địa chỉ thư điện tử hoặc tên người dùng.');
    return;
  }

  if (password.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }

  // Thông tin cần gửi
  const data = {
    username: username,
    password: password
  };

  // Thực hiện yêu cầu fetch tới API
  fetch('http://157.66.81.26:8000/api/account/login/', {
  // fetch('http://127.0.0.1:8000/api/account/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
      console.log('Success:', data);
      alert('Đăng nhập thành công!');
      window.location.href = 'http://127.0.0.1:8081/frontend/index.html'; // Điều hướng đến trang chủ
  })
  .catch(error => {
    alert('Đăng nhập thất bại: ' + error.message);
    console.error('Error:', error);
  });
}

function handleNewUserFormSubmit(event) {
  event.preventDefault(); // Ngăn chặn việc gửi form thông thường

  var email = document.getElementById('user_email').value;
  var username = document.getElementById('user_display_name').value;
  var password = document.getElementById('user_pass_crypt').value;
  var passwordConfirmation = document.getElementById('user_pass_crypt_confirmation').value;
  var considerPD = document.getElementById('user_consider_pd').checked;

  // Kiểm tra tính hợp lệ của dữ liệu
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('Vui lòng nhập địa chỉ thư điện tử hợp lệ.');
    return;
  }

  if (username.trim() === '') {
    alert('Vui lòng nhập tên hiển thị.');
    return;
  }

  if (password.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }

  if (password !== passwordConfirmation) {
    alert('Mật khẩu xác nhận không khớp.');
    return;
  }

  if (!considerPD) {
    alert('Vui lòng chấp nhận các điều khoản đóng góp.');
    return;
  }

  // Thông tin cần gửi
  const data = {
    email: email,
    username: username,
    password: password,
  };

  // Thực hiện yêu cầu fetch tới API
  fetch('http://157.66.81.26:8000/api/account/register/', {
    // fetch('http://127.0.0.1:8000/api/account/register/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      alert('Đăng ký thất bại.');
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Success:', data);
    alert('Tạo tài khoản thành công!');
    window.location.href = 'http://127.0.0.1:8081/frontend/pages/authPage/index.html'; // Điều hướng đến trang đăng nhập
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
