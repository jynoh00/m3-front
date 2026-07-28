import { POST_CONTENT_MAX_LENGTH } from "../../lib/format";

const TITLE_MAX_LENGTH = 26;

export default function StorySection({
  title,
  content,
  onTitleChange,
  onContentChange,
}) {
  return (
    <section className="form-section" aria-labelledby="story-section-title">
      <div className="section-heading">
        <span>01</span>
        <div>
          <h2 id="story-section-title">이야기</h2>
          <p>음악과 함께 기억하고 싶은 순간을 적어주세요.</p>
        </div>
      </div>

      <div className="form-field">
        <div className="field-label-row">
          <label htmlFor="post-title">제목 <b>*</b></label>
          <span><em>{title.length}</em>/{TITLE_MAX_LENGTH}</span>
        </div>
        <input
          id="post-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="제목을 입력해주세요."
        />
      </div>

      <div className="form-field">
        <div className="field-label-row">
          <label htmlFor="post-content">내용 <b>*</b></label>
          <span><em>{content.length}</em>/{POST_CONTENT_MAX_LENGTH}</span>
        </div>
        <textarea
          id="post-content"
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          maxLength={POST_CONTENT_MAX_LENGTH}
          placeholder="당신의 음악 순간을 들려주세요."
        />
      </div>
    </section>
  );
}

