tasksController = function() { 
	
	function errorLogger(errorCode, errorMessage) {
		console.log(errorCode +':'+ errorMessage);
	}
	
	var taskPage;
	var initialised = false;

	function taskCountChanged() {
		var count = $(taskPage).find('#tblTasks tbody tr').length;

		$('footer').find('#taskCount').text(count);
	}

	function clearTask() {
		$(taskPage).find('form').fromObject({});
	}

	function renderTable() {
		$.each($(taskPage).find('#tblTasks tbody tr'), function(idx,row){
			var due = Date.parse($(row).find('[datetime]').text());

			if (due.compareTo(Date.today()) < 0) {
				$(row).addClass("overdue");
			} else if (due.compareTo((2).days().fromNow()) <= 0) {
				$(row).addClass("warning");
			}

		});
	}
	
	return { 
		init : function(page, callback) { 
			if (initialised) {
				callback()
			} else {
				taskPage = page;

				//Initialize the storage engine
				storageEngine.init(function() {
					storageEngine.initObjectStore('task', function() {
						callback();
					}, errorLogger) 
				}, errorLogger);

				//Highlight required fields	 				
				$(taskPage).find('[required="required"]').prev('label').append( '<span>*</span>').children( 'span').addClass('required');
				
				//Add a task
				$(taskPage).find('#btnAddTask').click(function(evt) {
					evt.preventDefault();
					$(taskPage).find('#taskCreation').removeClass('not');
				});

				//Clear the form
				$(taskPage).find('#clearTask').click(function(evt) {
					evt.preventDefault();
					clearTask();
				});

				//Highlight the selected row
				$(taskPage).find('tbody').on('click','tr',function(evt) {
					$(evt.target).closest('td').siblings().andSelf().toggleClass('rowHighlight');
					//TODO: add code to turn the highlihg off other rows
				});
				
				//Delete a task
				$(taskPage).find('#tblTasks tbody').on('click', '.deleteRow', function(evt) { 					
					storageEngine.delete('task', $(evt.target).data().taskId, 
						function() {
							$(evt.target).parents('tr').remove(); 
							taskCountChanged();
						}, errorLogger);
					}
				);

				//Complete a task
				$(taskPage).find('#tblTasks tbody').on('click', '.completeRow', function(evt) { 					
					storageEngine.findById('task', $(evt.target).data().taskId, function(task) {
						task.complete = true;
						storageEngine.save('task',task,function(){
							tasksController.loadTasks();
						},errorLogger);
					},errorLogger);
				}); 
							
				
				//Edit a task
				$(taskPage).find('#tblTasks tbody').on('click', '.editRow', function(evt) { 
					$(taskPage).find('#taskCreation').removeClass('not');
					storageEngine.findById('task', $(evt.target).data().taskId, function(task) {
						$(taskPage).find('form').fromObject(task);
					}, errorLogger);
				});
				
				//Save a task
				$(taskPage).find('#saveTask').click(function(evt) {
					evt.preventDefault();
					if ($(taskPage).find('form').valid()) {
						var task = $(taskPage).find('form').toObject();		
						storageEngine.save('task', task, function() {
							$(taskPage).find('#tblTasks tbody').empty();
							tasksController.loadTasks();
							$(':input').val('');
							clearTask();
							$(taskPage).find('#taskCreation').addClass('not');
						}, errorLogger);
					}
				});
				initialised = true;
			}
		},
		loadTasks : function() {
			storageEngine.findAll('task', function(tasks) {
				tasks.sort(function(t1,t2){
					return Date.parse(t1.requiredBy).compareTo(Date.parse(t2.requiredBy));
				});
			$.each(tasks, function(index, task) {
				if(!task.complete){
					task.complete = false;
				}
				$('#taskRow').tmpl(task).appendTo($(taskPage).find('#tblTasks tbody'));
			});
			taskCountChanged();
			renderTable();
			}, errorLogger);
		} 
	} 
}();
