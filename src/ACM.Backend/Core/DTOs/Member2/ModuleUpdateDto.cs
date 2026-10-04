using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.DTOs
{
    /// <summary>
    /// DTO used to update an existing module's editable fields.
    /// </summary>
    public class ModuleUpdateDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}
