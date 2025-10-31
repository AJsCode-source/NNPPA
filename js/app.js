document.addEventListener('DOMContentLoaded', function() {
    
    // --- LOGIN FORM LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the form from submitting the traditional way

            const serviceNumberInput = document.getElementById('serviceNumber');
            const serviceNumber = serviceNumberInput.value.trim().toUpperCase();

            // Simple logic to check if the user is an admin or personnel
            // In a real application, this would be a secure check against a server
            if (serviceNumber.startsWith('ADMIN')) {
                // Redirect to the admin dashboard
                window.location.href = 'admin.html';
            } else if (serviceNumber.startsWith('NN')) {
                // Redirect to the personnel dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Optional: Show an error for invalid service number format
                alert('Invalid Service Number format. Please use "NN/..." or "ADMIN/..."');
                serviceNumberInput.focus();
            }
        });
    }

    // --- USER MANAGEMENT DROPDOWN LOGIC ---
    const actionButtons = document.querySelectorAll('.action-button');

    actionButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click from bubbling up to the window
            
            // Find the target dropdown menu using the 'data-target' attribute
            const targetId = this.getAttribute('data-target');
            const dropdown = document.getElementById(targetId);

            // Hide all other open dropdowns first
            document.querySelectorAll('[id^="dropdown-"]').forEach(d => {
                if (d.id !== targetId) {
                    d.classList.add('hidden');
                }
            });

            // Toggle the visibility of the clicked button's dropdown
            dropdown.classList.toggle('hidden');
        });
    });

    // Add a global click listener to hide dropdowns when clicking anywhere else on the page
    window.addEventListener('click', function() {
        document.querySelectorAll('[id^="dropdown-"]').forEach(d => {
            if (!d.classList.contains('hidden')) {
                d.classList.add('hidden');
            }
        });
    });

});

