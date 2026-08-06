// sa migration file
public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('contact_number')->nullable();
        $table->string('address')->nullable();
        $table->string('role')->default('volunteer'); // kung wala ka pa nito
    });
}