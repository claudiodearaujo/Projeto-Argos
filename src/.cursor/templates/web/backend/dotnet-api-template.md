# Template .NET API - Backend

## 🎯 Configuração Inicial

### .NET CLI
```bash
dotnet new webapi -n ProjetoAPI
cd ProjetoAPI
dotnet run
```

### Estrutura de Projeto
```
ProjetoAPI/
├── Controllers/
├── Models/
├── Services/
├── DTOs/
├── Data/
├── Middleware/
├── Extensions/
├── Configuration/
├── Properties/
└── Program.cs
```

### Program.cs (Minimal API)
```csharp
using Microsoft.EntityFrameworkCore;
using ProjetoAPI.Data;
using ProjetoAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<IExemploService, ExemploService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        builder => builder
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");
app.UseAuthorization();
app.MapControllers();

app.Run();
```

## 🏗️ Padrões de Desenvolvimento

### Controllers
```csharp
[ApiController]
[Route("api/[controller]")]
public class ExemploController : ControllerBase
{
    private readonly IExemploService _exemploService;

    public ExemploController(IExemploService exemploService)
    {
        _exemploService = exemploService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExemploDto>>> GetTodos()
    {
        var resultados = await _exemploService.GetTodosAsync();
        return Ok(resultados);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExemploDto>> GetById(int id)
    {
        var resultado = await _exemploService.GetByIdAsync(id);
        if (resultado == null)
            return NotFound();
        
        return Ok(resultado);
    }

    [HttpPost]
    public async Task<ActionResult<ExemploDto>> Create(CreateExemploDto createDto)
    {
        var resultado = await _exemploService.CreateAsync(createDto);
        return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateExemploDto updateDto)
    {
        await _exemploService.UpdateAsync(id, updateDto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _exemploService.DeleteAsync(id);
        return NoContent();
    }
}
```

### Models
```csharp
public class Exemplo
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public DateTime? DataAtualizacao { get; set; }
    public bool Ativo { get; set; } = true;
}
```

### DTOs
```csharp
public class ExemploDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public bool Ativo { get; set; }
}

public class CreateExemploDto
{
    [Required]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string Descricao { get; set; } = string.Empty;
}

public class UpdateExemploDto
{
    [Required]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string Descricao { get; set; } = string.Empty;
    
    public bool Ativo { get; set; }
}
```

### Services
```csharp
public interface IExemploService
{
    Task<IEnumerable<ExemploDto>> GetTodosAsync();
    Task<ExemploDto?> GetByIdAsync(int id);
    Task<ExemploDto> CreateAsync(CreateExemploDto createDto);
    Task UpdateAsync(int id, UpdateExemploDto updateDto);
    Task DeleteAsync(int id);
}

public class ExemploService : IExemploService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ExemploService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExemploDto>> GetTodosAsync()
    {
        var exemplos = await _context.Exemplos
            .Where(e => e.Ativo)
            .ToListAsync();
        
        return _mapper.Map<IEnumerable<ExemploDto>>(exemplos);
    }

    public async Task<ExemploDto?> GetByIdAsync(int id)
    {
        var exemplo = await _context.Exemplos
            .FirstOrDefaultAsync(e => e.Id == id && e.Ativo);
        
        return exemplo != null ? _mapper.Map<ExemploDto>(exemplo) : null;
    }

    public async Task<ExemploDto> CreateAsync(CreateExemploDto createDto)
    {
        var exemplo = _mapper.Map<Exemplo>(createDto);
        exemplo.DataCriacao = DateTime.UtcNow;
        
        _context.Exemplos.Add(exemplo);
        await _context.SaveChangesAsync();
        
        return _mapper.Map<ExemploDto>(exemplo);
    }

    public async Task UpdateAsync(int id, UpdateExemploDto updateDto)
    {
        var exemplo = await _context.Exemplos.FindAsync(id);
        if (exemplo == null)
            throw new NotFoundException($"Exemplo com ID {id} não encontrado");
        
        _mapper.Map(updateDto, exemplo);
        exemplo.DataAtualizacao = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var exemplo = await _context.Exemplos.FindAsync(id);
        if (exemplo == null)
            throw new NotFoundException($"Exemplo com ID {id} não encontrado");
        
        exemplo.Ativo = false;
        exemplo.DataAtualizacao = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
    }
}
```

### DbContext
```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Exemplo> Exemplos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Exemplo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Descricao).HasMaxLength(500);
            entity.Property(e => e.DataCriacao).IsRequired();
            entity.Property(e => e.Ativo).HasDefaultValue(true);
        });

        base.OnModelCreating(modelBuilder);
    }
}
```

## 📦 Packages Recomendados

### Essenciais
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
```

### Validação e Segurança
```xml
<PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="8.0.0" />
```

### Logging e Monitoramento
```xml
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="Serilog.Sinks.Console" Version="5.0.0" />
<PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
```

## 🔧 Configurações

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ProjetoAPIDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Middleware de Tratamento de Erros
```csharp
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro não tratado");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = new
            {
                message = ex.Message,
                details = ex.StackTrace
            }
        };

        context.Response.StatusCode = ex switch
        {
            NotFoundException => 404,
            ValidationException => 400,
            UnauthorizedAccessException => 401,
            _ => 500
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
```

## 🚀 Comandos Úteis

### Entity Framework
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet ef migrations add NomeDaMigracao
dotnet ef database drop
```

### Build e Teste
```bash
dotnet build
dotnet test
dotnet run
dotnet publish -c Release
``` 