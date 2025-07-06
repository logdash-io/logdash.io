<script lang="ts">
  type Props = {
    quote: string;
    person: string;
    img: string;
    company: {
      who: string;
      name: string;
      url: string;
    };
  };
  let { quote, person, img, company }: Props = $props();
</script>

<div class="flex flex-col gap-4">
  <blockquote class="text-base-content text-lg italic opacity-90">
    "{quote}"
  </blockquote>

  <div class="flex items-center justify-center gap-4">
    <div class="avatar">
      <div
        class="ring-primary ring-offset-base-100 h-12 w-12 rounded-full ring ring-offset-2"
      >
        <img class="grayscale-100" src={img} alt={person} />
      </div>
    </div>

    <div class="flex flex-col">
      <span class="text-base-content font-semibold">
        {person}
      </span>

      <span class="text-secondary/60 text-sm">
        {company.who} at
        <a target="_blank" href={company.url}>{company.name}</a>
      </span>
    </div>
  </div>
</div>
